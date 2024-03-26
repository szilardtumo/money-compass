'use server';

import { revalidateTag } from 'next/cache';

import { getSimpleAccount, getSubaccountBalances } from '@/lib/db/accounts.queries';
import { createTransactions } from '@/lib/db/transactions.actions';
import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

interface CreateSimpleAccountParams {
  name: string;
  currency: string;
  category: Enums<'account_category'>;
}

/**
 * Creates a new account with a single subaccount.
 *
 * @param params The parameters to create the account.
 * @returns
 */
export async function createSimpleAccount(
  params: CreateSimpleAccountParams,
): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({ name: params.name, category: params.category })
    .select('id')
    .single();

  if (accountError || !account) {
    return { success: false, error: { code: accountError.code, message: accountError.message } };
  }

  const { error: subaccountError } = await supabase
    .from('subaccounts')
    .insert({ currency: params.currency, account_id: account.id });

  if (subaccountError) {
    return {
      success: false,
      error: { code: subaccountError.code, message: subaccountError.message },
    };
  }

  revalidateTag('accounts');
  revalidateTag('subaccounts');
  return { success: true };
}

interface UpdateSimpleAccountParams {
  name?: string;
  currency?: string;
  category?: Enums<'account_category'>;
}

export async function updateSimpleAccount(
  id: string,
  params: UpdateSimpleAccountParams,
): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  const account = await getSimpleAccount(id);

  if (!account) {
    return {
      success: false,
      error: { code: ActionErrorCode.NotFound, message: 'Account not found.' },
    };
  }

  const currencyChanged = params.currency && params.currency !== account.currency;

  const [accountResult, subaccountResult] = await Promise.all([
    supabase
      .from('accounts')
      .update({ name: params.name, category: params.category })
      .eq('id', id)
      .select(),
    currencyChanged
      ? supabase.rpc('update_subaccount', {
          _id: account.subaccountId,
          _currency: params.currency!,
        })
      : undefined,
  ]);

  if (accountResult.error) {
    return {
      success: false,
      error: { code: accountResult.error.code, message: accountResult.error.message },
    };
  }

  if (subaccountResult?.error) {
    return {
      success: false,
      error: { code: subaccountResult.error.code, message: subaccountResult.error.message },
    };
  }

  if (currencyChanged) {
    revalidateTag('transactions');
  }
  revalidateTag('accounts');
  revalidateTag('subaccounts');
  return { success: true };
}

export async function deleteAccount(accountId: string): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from('accounts').delete().eq('id', accountId);

  if (error) {
    return { success: false, error: { code: error.code, message: error.message } };
  }

  revalidateTag('accounts');
  revalidateTag('subaccounts');
  return { success: true };
}

export async function updateAccountBalances(
  balances: Record<string, number>,
): Promise<ActionResponse> {
  const subaccountBalances = await getSubaccountBalances();

  const transactions: Parameters<typeof createTransactions>[0] = Object.entries(balances)
    .map(([subaccountId, balance]) => ({
      subaccountId,
      amount: balance - (subaccountBalances[subaccountId] ?? 0),
      type: 'correction' as const,
      description: 'Manual balance correction',
    }))
    .filter((transaction) => transaction.amount !== 0);

  return createTransactions(transactions);
}
