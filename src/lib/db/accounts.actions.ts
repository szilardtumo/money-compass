'use server';

import { revalidateTag } from 'next/cache';

import { ActionResponse } from '@/lib/types/transport.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

interface CreateSimpleAccountParams {
  name: string;
  currency: string;
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
    .insert({ name: params.name })
    .select('id')
    .single();

  if (accountError || !account) {
    return { success: false, error: { code: accountError.code, message: accountError.message } };
  }

  const { error: subaccountError } = await supabase
    .from('subaccounts')
    .insert({ currency: params.currency, account_id: account.id, value: 0 });

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
