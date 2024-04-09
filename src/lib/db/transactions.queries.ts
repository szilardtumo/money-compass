'use server';

import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { Enums } from '@/lib/types/database.types';
import { TimeInterval } from '@/lib/types/time.types';
import { Transaction, TransactionHistory } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';
import { generateTimeBuckets } from '@/lib/utils/timeBuckets';

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
    .select('*', { count: 'estimated' })
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

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  return {
    data:
      data?.map((transaction) => ({
        id: transaction.id,
        subaccountId: transaction.subaccount_id,
        type: transaction.type,
        amount: transaction.amount,
        balance: transaction.balance,
        startedDate: transaction.started_date,
        order: transaction.order,
        description: transaction.description,
      })) ?? [],
    page,
    pageSize,
    total: count ?? 0,
  };
}

export async function getTransactionHistory(
  dateRange: TimeInterval,
  interval: TimeInterval,
): Promise<TransactionHistory[]> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['transactions'] } });

  const [accounts, { data: buckets, error }] = await Promise.all([
    getSimpleAccounts(),
    supabase.rpc('query_transaction_history', {
      date_range: dateRange,
      bucket_interval: interval,
    }),
  ]);

  if (error) {
    throw error;
  }

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
    (date) => date >= new Date(buckets![0].interval_start),
  );

  const gapfilledData = timeBuckets.map((date) => {
    // update the balance of the subaccounts for the current date
    currentBalances = { ...currentBalances, ...dateMap[date.getTime()] };
    return {
      date: date.toISOString(),
      accountBalances: { ...currentBalances },
    };
  });

  return gapfilledData;
}
