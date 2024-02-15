'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { Account, CreateSimpleAccountParams, SimpleAccount } from '@/lib/types/accounts.types';
import { ActionResponse } from '@/lib/types/transport.types';

import { getCurrencyMapper } from './currencies';
import { Database } from './database.types';

/**
 * Returns the list of accounts with all of their subaccounts.
 * The total value of the account is calculated by converting all subaccounts' value to the provided main currency.
 *
 * @param mainCurrency The currency to use for the total value of the account.
 * @returns
 */
export async function getAccounts(mainCurrency: string): Promise<Account[]> {
  const supabase = createServerComponentClient<Database>({ cookies });

  const [{ data: accounts }, currencyMapper] = await Promise.all([
    supabase.from('accounts').select(`id, name, subaccounts(id, currency, value)`),
    getCurrencyMapper(mainCurrency),
  ]);

  return (accounts ?? []).map((account) => ({
    ...account,
    totalValue: account.subaccounts.reduce(
      (acc, current) =>
        acc +
        current.value *
          (current.currency === mainCurrency ? 1 : currencyMapper[current.currency] ?? 0),
      0,
    ),
  }));
}

/**
 * Returns the accounts which have only one subaccount.
 *
 * @returns
 */
export async function getSimpleAccounts(): Promise<SimpleAccount[]> {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: accounts } = await supabase
    .from('accounts')
    .select(`id, name, subaccounts(id, currency, value)`);

  return (accounts ?? [])
    .filter((account) => account.subaccounts.length === 1)
    .map((account) => ({
      id: account.id,
      name: account.name,
      value: account.subaccounts[0].value,
      currency: account.subaccounts[0].currency,
    }));
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
  const supabase = createServerComponentClient<Database>({ cookies });

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

  return { success: true };
}
