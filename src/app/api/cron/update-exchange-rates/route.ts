import type { NextRequest } from 'next/server';

import { getCurrencies } from '@/lib/db/currencies.queries';
import { createServerAdminSupabaseClient } from '@/lib/utils/supabase/server-admin';

interface ExchangeRatesResponse {
  success: true;
  terms: string;
  privacy: string;
  timestamp: number;
  date: string;
  base: string;
  rates: {
    [currency: string]: number;
  };
}

interface ExchangeRatesError {
  success: false;
  error: string;
  description: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET!}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const response = await fetch('https://api.fxratesapi.com/latest?base=USD');

  if (!response.ok) {
    const data = (await response.json()) as ExchangeRatesError;
    return Response.json(
      {
        success: false,
        error: data.description || data.error || 'Failed to fetch exchange rates.',
      },
      { status: 500 },
    );
  }

  const data = (await response.json()) as ExchangeRatesResponse;

  const currencies = await getCurrencies();

  const exchangeRates = currencies.flatMap((fromCurrency) =>
    currencies.map((toCurrency) => ({
      from: fromCurrency.id,
      to: toCurrency.id,
      rate: data.rates[toCurrency.id.toUpperCase()] / data.rates[fromCurrency.id.toUpperCase()],
    })),
  );

  const supabase = createServerAdminSupabaseClient();
  const { error } = await supabase.from('exchange_rates').upsert(exchangeRates);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, exchangeRates });
}
