import { sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { CACHE_TAGS, revalidateTag } from '@/lib/api/cache';
import { env } from '@/lib/env';
import { apiQueries } from '@/server/api/queries';
import { getAdminDb, schema } from '@/server/db';

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
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
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

  const currencies = await apiQueries.currencies.getCurrencies();

  const exchangeRates = currencies.flatMap((fromCurrency) =>
    currencies.map((toCurrency) => ({
      from: fromCurrency.id,
      to: toCurrency.id,
      rate: data.rates[toCurrency.id.toUpperCase()] / data.rates[fromCurrency.id.toUpperCase()],
    })),
  );

  try {
    const db = await getAdminDb();
    await db.admin
      .insert(schema.exchangeRates)
      .values(exchangeRates)
      .onConflictDoUpdate({
        target: [schema.exchangeRates.from, schema.exchangeRates.to],
        set: { rate: sql`EXCLUDED.rate` },
      });

    revalidateTag({ tag: CACHE_TAGS.currencies });
    return Response.json({ success: true, exchangeRates });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
