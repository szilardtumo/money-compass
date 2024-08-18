import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Account, SimpleAccount, Subaccount } from '@/lib/types/accounts.types';

import { getMainCurrencyWithMapper } from './currencies.queries';

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
 * The total value of the account is calculated by converting all subaccounts' value to the user's main currency.
 *
 * @returns
 */
export async function getAccounts(): Promise<Account[]> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['accounts'] } });

  const [
    { data: accounts, error },
    { mainCurrency, mapper: mainCurrencyMapper },
    subaccontBalances,
  ] = await Promise.all([
    supabase.from('accounts').select(`id, name, category, subaccounts(id, currency)`),
    getMainCurrencyWithMapper(),
    getSubaccountBalances(),
  ]);

  if (error) {
    throw error;
  }

  return (accounts ?? []).map((account) => {
    const subaccounts = account.subaccounts.map(
      (subaccount) =>
        ({
          id: subaccount.id,
          originalCurrency: subaccount.currency,
          mainCurrency,
          balance: {
            originalValue: subaccontBalances[subaccount.id] ?? 0,
            mainCurrencyValue:
              (subaccontBalances[subaccount.id] ?? 0) * mainCurrencyMapper[subaccount.currency],
          },
          accountId: account.id,
        }) satisfies Subaccount,
    );

    return {
      id: account.id,
      name: account.name,
      category: account.category,
      mainCurrency,
      totalBalance: subaccounts.reduce(
        (acc, current) => acc + current.balance.mainCurrencyValue,
        0,
      ),
      subaccounts,
    };
  });
}

/**
 * Returns the account with the specified id, with all of its subaccounts.
 *
 * @returns
 */
export async function getAccount(accountId: string): Promise<Account | undefined> {
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

  if (!account) {
    return undefined;
  }

  const [subaccountBalances, { mainCurrency, mapper: mainCurrencyMapper }] = await Promise.all([
    getSubaccountBalances(),
    getMainCurrencyWithMapper(),
  ]);

  const subaccounts = account.subaccounts.map(
    (subaccount) =>
      ({
        id: subaccount.id,
        originalCurrency: subaccount.currency,
        mainCurrency,
        balance: {
          originalValue: subaccountBalances[subaccount.id] ?? 0,
          mainCurrencyValue:
            (subaccountBalances[subaccount.id] ?? 0) * mainCurrencyMapper[subaccount.currency],
        },
        accountId: account.id,
      }) satisfies Subaccount,
  );

  return {
    id: account.id,
    name: account.name,
    category: account.category,
    mainCurrency,
    totalBalance: subaccounts.reduce((acc, current) => acc + current.balance.mainCurrencyValue, 0),
    subaccounts,
  };
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
