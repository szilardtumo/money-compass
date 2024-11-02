import 'server-only';

import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { TimeInterval } from '@/lib/types/time.types';
import { Transaction, TransactionHistory } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { generateTimeBuckets } from '@/lib/utils/time-buckets';
import { getAccounts } from '@/server/api/queries/accounts.queries';
import { getDb } from '@/server/db';
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
  accountId: string;
  currency: string;
};

function parseTransaction(
  data: DbTransactionWithCurrency,
  { mainCurrency, mainCurrencyMapper }: ParseTransactionParams,
): Transaction {
  const originalCurrency = data.currency;

  return {
    id: data.id,
    accountId: data.accountId,
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

export async function getTransactions({
  accountId,
  subaccountId,
  fromDate,
  toDate,
  page = 0,
  pageSize = 20,
}: GetTransactionsParams = {}): Promise<Paginated<Transaction>> {
  const db = await getDb();

  const query = db.transaction((tx) =>
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
      .orderBy(desc(transactions.startedDate), desc(transactions.createdAt))
      .offset(page * pageSize)
      .limit(pageSize),
  );

  const [data, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
    query,
    getMainCurrencyWithMapper(),
  ]);

  return {
    data:
      data?.map((transaction) =>
        parseTransaction(
          {
            ...transaction.transactions,
            accountId: transaction.subaccounts.accountId,
            currency: transaction.subaccounts.currency,
          },
          { mainCurrency, mainCurrencyMapper },
        ),
      ) ?? [],
    page,
    pageSize,
  };
}

export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['transactions'] } });

  const [{ data, error }, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, subaccounts(currency)')
      .eq('id', id)
      .single<DbTransactionWithCurrency>(),
    getMainCurrencyWithMapper(),
  ]);

  if (error) {
    throw error;
  }

  if (!data) {
    return undefined;
  }

  return parseTransaction(data, { mainCurrency, mainCurrencyMapper });
}

export async function getTransactionHistory(
  dateRange: TimeInterval,
  interval: TimeInterval,
): Promise<TransactionHistory[]> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['transactions'] } });

  const [accounts, { mainCurrency, mapper: mainCurrencyMapper }, { data: buckets, error }] =
    await Promise.all([
      getAccounts(),
      getMainCurrencyWithMapper(),
      supabase.rpc('query_transaction_history', {
        date_range: dateRange,
        bucket_interval: interval,
      }),
    ]);

  if (error) {
    throw error;
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

  const dateMap = buckets!.reduce(
    (acc, item) => {
      const date = new Date(item.interval_start).getTime();
      const subaccount = subaccountMap[item.subaccount_id];
      acc[date] ||= {};
      acc[date][item.subaccount_id] = item.last_balance;
      acc[date][subaccount.accountId] ||= 0;
      acc[date][subaccount.accountId] +=
        item.last_balance * mainCurrencyMapper[subaccount.originalCurrency];
      return acc;
    },
    {} as Record<number, Record<string, number>>,
  );

  // Generate time buckets for the date range and only keep the ones after the first transaction
  // This is needed to fill in the gaps in the data, in case there are no transactions for a specific date bucket
  const timeBuckets = generateTimeBuckets(dateRange, interval).filter(
    (date) => date >= new Date(buckets![0]?.interval_start),
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
                        currentBalances[subaccount.id] *
                        mainCurrencyMapper[subaccount.originalCurrency],
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
}
