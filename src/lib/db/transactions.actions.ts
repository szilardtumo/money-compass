'use server';

import { PostgrestError } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

import { getSubaccountBalance } from '@/lib/db/accounts.queries';
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

  try {
    const subaccountBalance = await getSubaccountBalance(params.subaccountId);
    const now = new Date().toISOString();

    const { error } = await supabase.from('transactions').insert({
      type: params.type,
      amount: params.amount,
      balance: subaccountBalance + params.amount,
      subaccount_id: params.subaccountId,
      started_date: now,
      completed_date: now,
    });

    if (error) {
      return { success: false, error: { code: error.code, message: error.message } };
    }

    revalidateTag('transactions');
    return { success: true };
  } catch (error) {
    const postgrestError = error as PostgrestError;
    return {
      success: false,
      error: { code: postgrestError.code, message: postgrestError.message },
    };
  }
}
