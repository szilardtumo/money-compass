'use server';

import { Enums } from '@/lib/types/database.types';
import { TimeInterval } from '@/lib/types/time.types';
import { Transaction, TransactionHistory } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

export interface CreateTransactionParams {
  subaccountId: string;
  type: Enums<'transaction_type'>;
  amount: number;
}

export async function getTransactions(
  page: number = 0,
  pageSize: number = 20,
): Promise<Paginated<Transaction>> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['transactions'] } });

  const { data, count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'estimated' })
    .order('started_date', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize);

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

  const { data, error } = await supabase.rpc('query_transaction_history', {
    date_range: dateRange,
    bucket_interval: interval,
  });

  if (error) {
    throw error;
  }

  const dateMap = data.reduce((acc, current) => {
    const currentAccounts = acc.get(current.interval_start) ?? {};

    acc.set(current.interval_start, {
      ...currentAccounts,
      [current.subaccount_id]: current.last_balance,
      total: (currentAccounts.total ?? 0) + current.last_balance,
    });

    return acc;
  }, new Map());

  const parsedData = Array.from(dateMap.entries()).map(([date, balances]) => ({
    date,
    balances,
  }));

  // If there is only one data point, duplicate it so that the chart renders a horizontal line
  if (parsedData.length === 1) {
    return [parsedData[0], { ...parsedData[0], date: new Date().toISOString() }];
  }

  return parsedData;
}
