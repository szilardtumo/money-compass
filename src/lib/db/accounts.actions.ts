'use server';

import { revalidateTag } from 'next/cache';

import { getSubaccountBalances } from '@/lib/db/accounts.queries';
import { createTransactions } from '@/lib/db/transactions.actions';
import { Enums } from '@/lib/types/database.types';
import { ActionResponse } from '@/lib/types/transport.types';
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
