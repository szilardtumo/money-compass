import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { getCurrencyMapper } from './currencies';
import { Database } from './database.types';

export async function getAccounts(mainCurrency: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const [{ data: accounts }, currencyMapper] = await Promise.all([
    supabase.from('accounts').select(`id, name, subaccounts(id, currency, value)`),
    getCurrencyMapper(mainCurrency),
  ]);

  return accounts?.map((account) => ({
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
