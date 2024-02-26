'use server';

import { Currency, CurrencyMapper } from '@/lib/types/currencies.types';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

export async function getCurrencies(): Promise<Currency[]> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['currencies'] } });

  const { data, error } = await supabase.from('currencies').select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getCurrencyMapper(toCurrency: string): Promise<CurrencyMapper> {
  const supabase = createServerSupabaseClient({ next: { revalidate: 60, tags: ['currencies'] } });

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('from, rate')
    .eq('to', toCurrency)
    .then((response) => ({
      ...response,
      data: Object.fromEntries(response.data?.map((item) => [item.from, item.rate]) ?? []),
    }));

  if (error) {
    throw error;
  }

  return data;
}
