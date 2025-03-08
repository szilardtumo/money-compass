import 'server-only';

import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';

import { CACHE_TAGS, cacheTag } from '@/lib/cache';
import { MissingExchangeRateError, MissingSubaccountError } from '@/lib/errors';
import { generateTimeBuckets, TimeInterval } from '@/lib/utils/time-buckets';
import { getDb, schema } from '@/server/db';
import { descTransactions } from '@/server/db/query-utils';
import { subaccounts, transactions } from '@/server/db/schema';

import { CurrencyMapper } from '../../../lib/types/currencies.types';
import { Transaction, TransactionHistory } from '../../../lib/types/transactions.types';
import { Paginated } from '../../../lib/types/transport.types';
import { createAuthenticatedApiQuery } from '../create-api-query';
import { getMainCurrencyWithMapper } from '../currencies/queries';

type DbTransactionWithSubaccount = typeof transactions.$inferSelect & {
  subaccount: typeof subaccounts.$inferSelect;
};

/**
 * Maps a database transaction to the Transaction domain model with currency conversion
 *
 * @param data The database transaction with its subaccount
 * @param mainCurrency The main currency of the user
 * @param mainCurrencyMapper The mapper of the main currency
 * @returns The mapped Transaction
 */
const mapTransactionData = (
  data: DbTransactionWithSubaccount,
  mainCurrency: string,
  mainCurrencyMapper: CurrencyMapper,
): Transaction => {
  const originalCurrency = data.subaccount.currency;
  const exchangeRate = mainCurrencyMapper[originalCurrency];

  if (!exchangeRate) {
    throw new MissingExchangeRateError(originalCurrency);
  }

  return {
    id: data.id,
    accountId: data.subaccount.accountId,
    subaccountId: data.subaccountId,
    type: data.type,
    amount: {
      originalValue: data.amount,
      mainCurrencyValue: data.amount * exchangeRate,
    },
    balance: {
      originalValue: data.balance,
      mainCurrencyValue: data.balance * exchangeRate,
    },
    originalCurrency,
    mainCurrency,
    startedDate: data.startedDate,
    description: data.description,
    createdAt: data.createdAt,
  };
};

/**
 * Returns a paginated list of transactions with optional filtering
 *
 * The transactions are converted to the user's main currency for consistent display
 *
 * @param params The parameters for fetching transactions
 * @returns The paginated list of transactions
 */
export const getTransactions = createAuthenticatedApiQuery<
  {
    /** The ID of the account to filter by */
    accountId?: string;
    /** The ID of the subaccount to filter by */
    subaccountId?: string;
    /** The start date of the date range to filter by */
    fromDate?: string;
    /** The end date of the date range to filter by */
    toDate?: string;
    /** The page number to fetch */
    page?: number;
    /** The number of transactions per page */
    pageSize?: number;
  } | void,
  Paginated<Transaction>
>(
  async ({
    input: { accountId, subaccountId, fromDate, toDate, page = 0, pageSize = 20 } = {},
    ctx,
  }) => {
    // Cache key for all transactions for the user
    'use cache';
    cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

    const db = await getDb(ctx.supabaseToken);

    // Set up the database query
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

    // Run the database query and get the main currency in parallel
    const [data, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
      query,
      getMainCurrencyWithMapper.withContext({ ctx }),
    ]);

    // Map the transactions to the Transaction domain model
    return {
      data: data.map((item) =>
        mapTransactionData(
          {
            ...item.transactions,
            subaccount: item.subaccounts,
          },
          mainCurrency,
          mainCurrencyMapper,
        ),
      ),
      page,
      pageSize,
    };
  },
);

/**
 * Returns a single transaction by its ID
 *
 * The transaction is converted to the user's main currency for consistent display
 *
 * @param id The ID of the transaction to fetch
 * @returns The transaction
 */
export const getTransactionById = createAuthenticatedApiQuery<string, Transaction | undefined>(
  async ({ input: id, ctx }) => {
    // Cache key for the single transaction
    'use cache';
    cacheTag.id(id, CACHE_TAGS.transactions);

    const db = await getDb(ctx.supabaseToken);

    // Run the database query and get the main currency in parallel
    const [transaction, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
      db.rls((tx) =>
        tx.query.transactions.findFirst({
          where: (table, { eq }) => eq(table.id, id),
          with: { subaccount: true },
        }),
      ),
      getMainCurrencyWithMapper.withContext({ ctx }),
    ]);

    // If the transaction is not found, return undefined
    if (!transaction) {
      return undefined;
    }

    // If the subaccount is not found, return undefined
    if (!transaction.subaccount) {
      throw new MissingSubaccountError(transaction.subaccountId);
    }

    // Map the transaction to the Transaction domain model
    return mapTransactionData(
      // Ensure subaccount is non-null
      { ...transaction, subaccount: transaction.subaccount },
      mainCurrency,
      mainCurrencyMapper,
    );
  },
);

/**
 * Returns transaction history aggregated by time intervals
 *
 * The history includes account and subaccount balances over time,
 * with all values converted to the user's main currency
 */
export const getTransactionHistory = createAuthenticatedApiQuery<
  {
    /** The date range to fetch the history for */
    dateRange: TimeInterval;
    /** The interval to aggregate the history by */
    interval: TimeInterval;
  },
  TransactionHistory[]
>(async ({ input, ctx }) => {
  // Cache keys for the transactions and accounts for the user
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.transactions);
  cacheTag.user(ctx.userId, CACHE_TAGS.accounts);

  const db = await getDb(ctx.supabaseToken);

  // Run the database queries in parallel
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

  // If there are no transactions in the date range, return an empty array
  if (!buckets || buckets.length === 0) {
    return [];
  }

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

  const dateMap = buckets.reduce(
    (acc, item) => {
      const date = new Date(item.intervalStart).getTime();
      const subaccount = subaccountMap[item.subaccountId];

      if (!subaccount) {
        throw new MissingSubaccountError(item.subaccountId);
      }

      const exchangeRate = mainCurrencyMapper[subaccount.currency];

      if (!exchangeRate) {
        throw new MissingExchangeRateError(subaccount.currency);
      }

      acc[date] ||= {};
      acc[date][item.subaccountId] = item.lastBalance;
      acc[date][subaccount.accountId] ||= 0;
      acc[date][subaccount.accountId] += item.lastBalance * exchangeRate;
      return acc;
    },
    {} as Record<number, Record<string, number>>,
  );

  // Generate time buckets for the date range and only keep the ones after the first transaction
  // This is needed to fill in the gaps in the data, in case there are no transactions for a specific date bucket
  const timeBuckets = generateTimeBuckets(input.dateRange, input.interval).filter(
    (date) => date >= new Date(buckets[0]?.intervalStart),
  );

  const gapfilledData = timeBuckets.map((date) => {
    // update the balance of the subaccounts for the current date
    currentBalances = { ...currentBalances, ...dateMap[date.getTime()] };
    return {
      date: date,
      accountBalances: Object.fromEntries(
        accounts.map((account) => {
          const subaccountBalances = Object.fromEntries(
            account.subaccounts.map((subaccount) => {
              const originalValue = currentBalances[subaccount.id] ?? 0;
              const exchangeRate = mainCurrencyMapper[subaccount.currency];

              if (!exchangeRate) {
                throw new MissingExchangeRateError(subaccount.currency);
              }

              return [
                subaccount.id,
                {
                  originalValue,
                  mainCurrencyValue: originalValue * exchangeRate,
                },
              ];
            }),
          );

          return [
            account.id,
            {
              totalBalance: currentBalances[account.id] ?? 0,
              subaccountBalances,
            },
          ] as const;
        }),
      ),
      mainCurrency,
    } satisfies TransactionHistory;
  });

  return gapfilledData;
});
