'use server';

import { Account, SimpleAccount } from '@/lib/types/accounts.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

import { getCurrencyMapper, getMainCurrencyWithMapper } from './currencies.queries';

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

  return data?.balance ?? 0;
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
    supabase.from('accounts').select(`id, name, category, subaccounts(id, currency)`),
    getCurrencyMapper(mainCurrency),
    getSubaccountBalances(),
  ]);

  if (error) {
    throw error;
  }

  return (accounts ?? []).map((account) => ({
    id: account.id,
    name: account.name,
    category: account.category,
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

  const [
    { data: accounts, error },
    subaccountBalances,
    { mainCurrency, mapper: mainCurrencyMapper },
  ] = await Promise.all([
    supabase.from('accounts').select(`id, name, category, subaccounts(id, currency)`),
    getSubaccountBalances(),
    getMainCurrencyWithMapper(),
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
      balance: {
        originalValue: subaccountBalances[account.subaccounts[0].id] ?? 0,
        mainCurrencyValue:
          (subaccountBalances[account.subaccounts[0].id] ?? 0) *
          mainCurrencyMapper[account.subaccounts[0].currency],
      },
      originalCurrency: account.subaccounts[0].currency,
      mainCurrency,
      category: account.category,
    }));
}

/**
 * Returns the account with the specified id, if it has only one subaccount.
 *
 * @returns
 */
export async function getSimpleAccount(accountId: string): Promise<SimpleAccount | undefined> {
  const supabase = createServerSupabaseClient({
    next: { revalidate: 60, tags: ['accounts', accountId] },
  });

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select(`id, name, category, subaccounts(id, currency)`)
    .eq('id', accountId)
    .maybeSingle();

  if (accountError) {
    throw accountError;
  }

  if (!account || account.subaccounts.length !== 1) {
    return undefined;
  }

  const [subaccountBalance, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
    getSubaccountBalance(account.subaccounts[0].id),
    getMainCurrencyWithMapper(),
  ]);

  return {
    id: account.id,
    subaccountId: account.subaccounts[0].id,
    name: account.name,
    balance: {
      originalValue: subaccountBalance,
      mainCurrencyValue: subaccountBalance * mainCurrencyMapper[account.subaccounts[0].currency],
    },
    originalCurrency: account.subaccounts[0].currency,
    mainCurrency,
    category: account.category,
  };
}
