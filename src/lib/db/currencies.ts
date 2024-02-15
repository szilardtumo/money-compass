import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { Database } from '@/lib/db/database.types';
import { Currency, CurrencyMapper } from '@/lib/types/currencies.types';

export async function getCurrencies(): Promise<Currency[]> {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data } = await supabase.from('currencies').select();

  return data ?? [];
}

export async function getCurrencyMapper(toCurrency: string): Promise<CurrencyMapper> {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data } = await supabase
    .from('exchange_rates')
    .select('from, rate')
    .eq('to', toCurrency)
    .then((response) => ({
      ...response,
      data: Object.fromEntries(response.data?.map((item) => [item.from, item.rate]) ?? []),
    }));

  return data;
}
