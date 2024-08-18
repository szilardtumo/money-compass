import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Currency, CurrencyMapper } from '@/lib/types/currencies.types';

import { getProfile } from './profiles.queries';

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
      data: {
        ...Object.fromEntries(response.data?.map((item) => [item.from, item.rate]) ?? []),
        [toCurrency]: 1,
      },
    }));

  if (error) {
    throw error;
  }

  return data;
}

export async function getMainCurrencyWithMapper(): Promise<{
  mainCurrency: string;
  mapper: CurrencyMapper;
}> {
  const profile = await getProfile();
  const mainCurrencyMapper = await getCurrencyMapper(profile.mainCurrency);

  return { mainCurrency: profile.mainCurrency, mapper: mainCurrencyMapper };
}
