'use server';

import { PostgrestError } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { apiQueries } from '@/server/api/queries';

export interface CreateTransactionParams {
  subaccountId: string;
  type: Enums<'transaction_type'>;
  amount: number;
  description: string;
  date: string;
}

export async function createTransaction(params: CreateTransactionParams): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  try {
    const {
      data: [latestTransaction],
    } = await apiQueries.transactions.getTransactions({
      pageSize: 1,
      subaccountId: params.subaccountId,
      toDate: params.date,
    });

    const { error } = await supabase.from('transactions').insert({
      type: params.type,
      amount: params.amount,
      balance: (latestTransaction?.balance.originalValue ?? 0) + params.amount,
      subaccount_id: params.subaccountId,
      description: params.description,
      started_date: params.date,
      completed_date: params.date,
      order: latestTransaction ? latestTransaction.order + 1 : 0,
    });

    if (error) {
      return { success: false, error: { code: error.code, message: error.message } };
    }

    await supabase.rpc('update_transaction_balances', {
      _subaccount_id: params.subaccountId,
      fromdate: params.date,
      amounttoadd: params.amount,
    });

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
    const subaccountBalances = await apiQueries.accounts.getSubaccountBalances();
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
        order: 0,
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

interface UpdateTransactionParams {
  type?: Enums<'transaction_type'>;
  amount?: number;
  description?: string;
}

export async function updateTransaction(
  transactionId: string,
  params: UpdateTransactionParams,
): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  const transaction = await apiQueries.transactions.getTransactionById(transactionId);

  if (!transaction) {
    return {
      success: false,
      error: { code: ActionErrorCode.NotFound, message: 'Transaction not found.' },
    };
  }

  const amountToAdd =
    (params.amount ?? transaction.amount.originalValue) - transaction.amount.originalValue;

  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        type: params.type,
        amount: params.amount,
        description: params.description,
        balance: transaction.balance.originalValue + amountToAdd,
      })
      .eq('id', transactionId);

    if (error) {
      return { success: false, error: { code: error.code, message: error.message } };
    }

    if (amountToAdd) {
      await supabase.rpc('update_transaction_balances', {
        _subaccount_id: transaction.subaccountId,
        fromdate: transaction.startedDate,
        amounttoadd: amountToAdd,
      });
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
    const latestTransactions = await apiQueries.transactions.getTransactions({
      pageSize: transactionIds.length,
    });

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
