import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CurrencyMapper, CurrencyValue } from '@/lib/types/currencies.types';
import { Enums, Tables } from '@/lib/types/database.types';
import { TimeInterval } from '@/lib/types/time.types';
import { Transaction, TransactionHistory } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { generateTimeBuckets } from '@/lib/utils/time-buckets';

import { getSimpleAccounts } from './accounts.queries';
import { getMainCurrencyWithMapper } from './currencies.queries';

export interface CreateTransactionParams {
  subaccountId: string;
  type: Enums<'transaction_type'>;
  amount: number;
}

interface GetTransactionsParams {
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

interface DbTransactionWithCurrency extends Tables<'transactions'> {
  subaccounts: { currency: string };
}

function parseTransaction(
  data: DbTransactionWithCurrency,
  { mainCurrency, mainCurrencyMapper }: ParseTransactionParams,
): Transaction {
  const originalCurrency = data.subaccounts.currency;

  return {
    id: data.id,
    subaccountId: data.subaccount_id,
    type: data.type,
    amount: {
      originalValue: data.amount,
      mainCurrencyValue: data.amount * mainCurrencyMapper[originalCurrency],
    },
    balance: {
      originalValue: data.balance,
      mainCurrencyValue: data.balance * mainCurrencyMapper[originalCurrency],
    },
    originalCurrency,
    mainCurrency,
    startedDate: data.started_date,
    order: data.order,
    description: data.description,
  };
}

export async function getTransactions({
  subaccountId,
  fromDate,
  toDate,
  page = 0,
  pageSize = 20,
}: GetTransactionsParams = {}): Promise<Paginated<Transaction>> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['transactions'] } });

  let query = supabase
    .from('transactions')
    .select('*, subaccounts(currency)', { count: 'estimated' })
    .order('started_date', { ascending: false })
    .order('order', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (subaccountId) {
    query = query.eq('subaccount_id', subaccountId);
  }
  if (fromDate) {
    query = query.gte('started_date', fromDate);
  }
  if (toDate) {
    query = query.lte('started_date', toDate);
  }

  const [{ data, count, error }, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
    query.returns<DbTransactionWithCurrency[]>(),
    getMainCurrencyWithMapper(),
  ]);

  if (error) {
    throw error;
  }

  return {
    data:
      data?.map((transaction) =>
        parseTransaction(transaction, { mainCurrency, mainCurrencyMapper }),
      ) ?? [],
    page,
    pageSize,
    total: count ?? 0,
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
      getSimpleAccounts(),
      getMainCurrencyWithMapper(),
      supabase.rpc('query_transaction_history', {
        date_range: dateRange,
        bucket_interval: interval,
      }),
    ]);

  if (error) {
    throw error;
  }

  const accountMap = Object.fromEntries(accounts.map((account) => [account.subaccountId, account]));

  // FIXME: We consider that the account has a balance of 0 at the beginning of the date range, but that's not always true
  // We need to fetch the balance at the beginning of the date range and use that as the starting balance
  let currentBalances: Record<string, number> = Object.fromEntries(
    accounts.map((account) => [account.subaccountId, 0]),
  );

  const dateMap = buckets!.reduce(
    (acc, item) => {
      const date = new Date(item.interval_start).getTime();
      acc[date] ||= {};
      acc[date][item.subaccount_id] = item.last_balance;
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
      date: date.toISOString(),
      accountBalances: Object.fromEntries(
        Object.entries(currentBalances).map(([id, balance]) => [
          id,
          {
            originalValue: balance,
            mainCurrencyValue: balance * mainCurrencyMapper[accountMap[id].originalCurrency],
          } satisfies CurrencyValue,
        ]),
      ),
      mainCurrency,
    };
  });

  return gapfilledData;
}
