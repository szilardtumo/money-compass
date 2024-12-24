import 'server-only';

import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';

import { CACHE_TAGS, cacheTag } from '@/lib/cache';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { TimeInterval } from '@/lib/types/time.types';
import { Transaction, TransactionHistory } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { generateTimeBuckets } from '@/lib/utils/time-buckets';
import { createAuthenticatedApiQuery } from '@/server/api/create-api-query';
import { getDb, schema } from '@/server/db';
import { descTransactions } from '@/server/db/query-utils';
import { subaccounts, transactions } from '@/server/db/schema';

import { getMainCurrencyWithMapper } from './currencies.queries';

interface GetTransactionsParams {
  accountId?: string;
  subaccountId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

interface ParseTransactionParams {
  mainCurrency: string;
  mainCurrencyMapper: CurrencyMapper;
}

type DbTransactionWithCurrency = typeof transactions.$inferSelect & {
  subaccount: typeof subaccounts.$inferSelect | null;
};

function parseTransaction(
  data: DbTransactionWithCurrency,
  { mainCurrency, mainCurrencyMapper }: ParseTransactionParams,
): Transaction | undefined {
  if (!data.subaccount) {
    return undefined;
  }

  const originalCurrency = data.subaccount.currency;

  return {
    id: data.id,
    accountId: data.subaccount.accountId,
    subaccountId: data.subaccountId,
    type: data.type,
    amount: {
      originalValue: Number(data.amount),
      mainCurrencyValue: Number(data.amount) * mainCurrencyMapper[originalCurrency],
    },
    balance: {
      originalValue: Number(data.balance),
      mainCurrencyValue: Number(data.balance) * mainCurrencyMapper[originalCurrency],
    },
    originalCurrency,
    mainCurrency,
    startedDate: data.startedDate,
    description: data.description,
    createdAt: data.createdAt,
  };
}

export const getTransactions = createAuthenticatedApiQuery<
  GetTransactionsParams | void,
  Paginated<Transaction>
>(
  async ({
    input: { accountId, subaccountId, fromDate, toDate, page = 0, pageSize = 20 } = {},
    ctx,
  }) => {
    'use cache';
    cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

    const db = await getDb(ctx.supabaseToken);

    const query = db.rls((tx) =>
      tx
        .select()
        .from(transactions)
        .innerJoin(subaccounts, eq(transactions.subaccountId, subaccounts.id))
        .where(
          and(
            accountId ? eq(subaccounts.accountId, accountId) : undefined,
            subaccountId ? eq(transactions.subaccountId, subaccountId) : undefined,
            fromDate ? gte(transactions.startedDate, new Date(fromDate)) : undefined,
            toDate ? lte(transactions.startedDate, new Date(toDate)) : undefined,
          ),
        )
        .orderBy(...descTransactions())
        .offset(page * pageSize)
        .limit(pageSize),
    );

    const [data, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
      query,
      getMainCurrencyWithMapper.withContext({ ctx }),
    ]);

    return {
      data: data
        .map((transaction) =>
          parseTransaction(
            {
              ...transaction.transactions,
              subaccount: transaction.subaccounts,
            },
            { mainCurrency, mainCurrencyMapper },
          ),
        )
        .filter(Boolean),
      page,
      pageSize,
    };
  },
);

export const getTransactionById = createAuthenticatedApiQuery<string, Transaction | undefined>(
  async ({ input: id, ctx }) => {
    'use cache';
    cacheTag.id(id, CACHE_TAGS.transactions);

    const db = await getDb(ctx.supabaseToken);

    const [transaction, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
      db.rls((tx) =>
        tx.query.transactions.findFirst({
          where: (table, { eq }) => eq(table.id, id),
          with: { subaccount: true },
        }),
      ),
      getMainCurrencyWithMapper.withContext({ ctx }),
    ]);

    if (!transaction) {
      return undefined;
    }

    return parseTransaction(transaction, { mainCurrency, mainCurrencyMapper });
  },
);

interface GetTransactionHistoryInput {
  dateRange: TimeInterval;
  interval: TimeInterval;
}

export const getTransactionHistory = createAuthenticatedApiQuery<
  GetTransactionHistoryInput,
  TransactionHistory[]
>(async ({ input, ctx }) => {
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.transactions);
  cacheTag.user(ctx.userId, CACHE_TAGS.accounts);

  const db = await getDb(ctx.supabaseToken);

  const [{ mainCurrency, mapper: mainCurrencyMapper }, accounts, buckets] = await Promise.all([
    getMainCurrencyWithMapper.withContext({ ctx }),
    db.rls((tx) => tx.query.accounts.findMany({ with: { subaccounts: true } })),
    db.rls((tx) => {
      const sorted = tx.$with('sorted').as((qb) =>
        qb
          .select()
          .from(schema.transactions)
          .where(gte(schema.transactions.startedDate, sql`now() - ${input.dateRange}::interval`))
          .orderBy(...descTransactions()),
      );

      return tx
        .with(sorted)
        .select({
          subaccountId: sorted.subaccountId,
          intervalStart:
            sql<string>`time_bucket(${input.interval}::interval, ${sorted.startedDate})`.as(
              'intervalStart',
            ),
          lastBalance: sql`last(${sorted.balance}, ${sorted.startedDate} )`
            .mapWith(Number)
            .as('lastBalance'),
        })
        .from(sorted)
        .groupBy((table) => [table.subaccountId, table.intervalStart])
        .orderBy((table) => asc(table.intervalStart));
    }),
  ]);

  const subaccounts = accounts.flatMap((account) => account.subaccounts);
  const subaccountMap = Object.fromEntries(
    subaccounts.map((subaccount) => [subaccount.id, subaccount]),
  );

  // Contains the current balance of each subaccount in its original currency, and of each account in the main currency
  //
  // FIXME: We consider that the account has a balance of 0 at the beginning of the date range, but that's not always true
  // We need to fetch the balance at the beginning of the date range and use that as the starting balance
  let currentBalances: Record<string, number> = Object.fromEntries([
    ...subaccounts.map((subaccount) => [subaccount.id, 0]),
    ...accounts.map((account) => [account.id, 0]),
  ]);

  const dateMap = buckets!.reduce(
    (acc, item) => {
      const date = new Date(item.intervalStart).getTime();
      const subaccount = subaccountMap[item.subaccountId];
      acc[date] ||= {};
      acc[date][item.subaccountId] = item.lastBalance;
      acc[date][subaccount.accountId] ||= 0;
      acc[date][subaccount.accountId] += item.lastBalance * mainCurrencyMapper[subaccount.currency];
      return acc;
    },
    {} as Record<number, Record<string, number>>,
  );

  // Generate time buckets for the date range and only keep the ones after the first transaction
  // This is needed to fill in the gaps in the data, in case there are no transactions for a specific date bucket
  const timeBuckets = generateTimeBuckets(input.dateRange, input.interval).filter(
    (date) => date >= new Date(buckets![0]?.intervalStart),
  );

  const gapfilledData = timeBuckets.map((date) => {
    // update the balance of the subaccounts for the current date
    currentBalances = { ...currentBalances, ...dateMap[date.getTime()] };
    return {
      date: date,
      accountBalances: Object.fromEntries(
        accounts.map(
          (account) =>
            [
              account.id,
              {
                totalBalance: currentBalances[account.id],
                subaccountBalances: Object.fromEntries(
                  account.subaccounts.map((subaccount) => [
                    subaccount.id,
                    {
                      originalValue: currentBalances[subaccount.id],
                      mainCurrencyValue:
                        currentBalances[subaccount.id] * mainCurrencyMapper[subaccount.currency],
                    },
                  ]),
                ),
              },
            ] as const,
        ),
      ),
      mainCurrency,
    } satisfies TransactionHistory;
  });

  return gapfilledData;
});
