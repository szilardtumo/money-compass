'use server';

import { revalidateTag } from 'next/cache';

import { Enums } from '@/lib/types/database.types';
import { ActionResponse } from '@/lib/types/transport.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

export interface CreateTransactionParams {
  subaccountId: string;
  type: Enums<'transaction_type'>;
  amount: number;
}

export async function createTransaction(params: CreateTransactionParams): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  const now = new Date().toISOString();

  const { error } = await supabase.from('transactions').insert({
    type: params.type,
    amount: params.amount,
    subaccount_id: params.subaccountId,
    started_date: now,
    completed_date: now,
  });

  if (error) {
    return { success: false, error: { code: error.code, message: error.message } };
  }

  revalidateTag('transactions');
  return { success: true };
}
