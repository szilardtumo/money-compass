'use server';

import { Enums } from '@/lib/types/database.types';
import { TimeInterval } from '@/lib/types/time.types';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

export interface CreateTransactionParams {
  subaccountId: string;
  type: Enums<'transaction_type'>;
  amount: number;
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
    return [parsedData[0], parsedData[0]];
  }

  return parsedData;
}
