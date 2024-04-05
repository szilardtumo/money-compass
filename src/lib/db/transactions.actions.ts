'use server';

import { PostgrestError } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

import { getSubaccountBalance, getSubaccountBalances } from '@/lib/db/accounts.queries';
import { getTransactions } from '@/lib/db/transactions.queries';
import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

export interface CreateTransactionParams {
  subaccountId: string;
  type: Enums<'transaction_type'>;
  amount: number;
  description: string;
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
      description: params.description,
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

export async function createTransactions(
  transactions: CreateTransactionParams[],
): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  try {
    const subaccountBalances = await getSubaccountBalances();
    const now = new Date().toISOString();

    const { error } = await supabase.from('transactions').insert(
      transactions.map((transaction) => ({
        type: transaction.type,
        amount: transaction.amount,
        balance: (subaccountBalances[transaction.subaccountId] ?? 0) + transaction.amount,
        subaccount_id: transaction.subaccountId,
        description: transaction.description,
        started_date: now,
        completed_date: now,
      })),
    );

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

export async function deleteTransactions(transactionIds: string[]): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  try {
    const latestTransactions = await getTransactions({ pageSize: transactionIds.length });

    const areLatestTransactions = transactionIds.every((id) =>
      latestTransactions.data.some((transaction) => transaction.id === id),
    );
    if (!areLatestTransactions) {
      return {
        success: false,
        error: {
          code: ActionErrorCode.NotLatestTransactions,
          message: 'Only the latest transactions can be deleted.',
        },
      };
    }

    const { error } = await supabase.from('transactions').delete().in('id', transactionIds);

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
