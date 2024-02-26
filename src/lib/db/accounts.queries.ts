'use server';

import { Account, SimpleAccount } from '@/lib/types/accounts.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

import { getCurrencyMapper } from './currencies.queries';

export async function getSubaccountBalances(): Promise<Record<string, number>> {
  const supabase = createServerSupabaseClient({
    next: { revalidate: 60, tags: ['subaccounts', 'transactions'] },
  });

  const { data, error } = await supabase.from('balances').select('subaccount_id, balance');

  if (error) {
    throw error;
  }

  const balances = data.reduce<Record<string, number>>((acc, current) => {
    acc[current.subaccount_id!] = current.balance ?? 0;
    return acc;
  }, {});

  return balances;
}

export async function getSubaccountBalance(subaccountId: string): Promise<number> {
  const supabase = createServerSupabaseClient({
    next: { revalidate: 60, tags: ['subaccounts', 'transactions'] },
  });

  const { data, error } = await supabase
    .from('balances')
    .select('balance')
    .eq('subaccount_id', subaccountId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data!.balance ?? 0;
}

/**
 * Returns the list of accounts with all of their subaccounts.
 * The total value of the account is calculated by converting all subaccounts' value to the provided main currency.
 *
 * @param mainCurrency The currency to use for the total value of the account.
 * @returns
 */
export async function getAccounts(mainCurrency: string): Promise<Account[]> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['accounts'] } });

  const [{ data: accounts, error }, currencyMapper, subaccontBalances] = await Promise.all([
    supabase.from('accounts').select(`id, name, subaccounts(id, currency)`),
    getCurrencyMapper(mainCurrency),
    getSubaccountBalances(),
  ]);

  if (error) {
    throw error;
  }

  return (accounts ?? []).map((account) => ({
    id: account.id,
    name: account.name,
    subaccounts: account.subaccounts.map((subaccount) => ({
      id: subaccount.id,
      currency: subaccount.currency,
      balance: subaccontBalances[subaccount.id] ?? 0,
    })),
    totalBalance: account.subaccounts.reduce(
      (acc, current) =>
        acc +
        (subaccontBalances[current.id] ?? 0) *
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
  const supabase = createServerSupabaseClient({
    next: { revalidate: 60, tags: ['accounts'] },
  });

  const [{ data: accounts, error }, subaccountBalances] = await Promise.all([
    supabase.from('accounts').select(`id, name, subaccounts(id, currency)`),
    getSubaccountBalances(),
  ]);

  if (error) {
    throw error;
  }

  return (accounts ?? [])
    .filter((account) => account.subaccounts.length === 1)
    .map((account) => ({
      id: account.id,
      subaccountId: account.subaccounts[0].id,
      name: account.name,
      balance: subaccountBalances[account.subaccounts[0].id] ?? 0,
      currency: account.subaccounts[0].currency,
    }));
}
