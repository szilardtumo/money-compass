import { createServerComponentClient } from '../supabase/createServerComponentClient';

export async function getCurrencyMapper(toCurrency: string) {
  const supabase = createServerComponentClient({ next: { revalidate: 3600 } });

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
