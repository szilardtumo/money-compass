import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { createApiQuery } from '@/lib/api';
import { Currency, CurrencyMapper } from '@/lib/types/currencies.types';
import { getAdminDb } from '@/server/db';

import { getProfile } from '../profiles/queries';

/**
 * Returns all currencies from the database.
 *
 * @returns All currencies from the database.
 */
export const getCurrencies = createApiQuery<void, Currency[]>(async () => {
  'use cache';
  cacheTag('currencies');
  cacheLife('days');

  const db = await getAdminDb();

  return db.admin.query.currencies.findMany();
});

/**
 * Returns a mapper of currency exchange rates from the database.
 *
 * @param toCurrency The currency to map the exchange rates to.
 * @returns A mapper of currency exchange rates from the database.
 */
export const getCurrencyMapper = createApiQuery<string, CurrencyMapper>(
  async ({ input: toCurrency }) => {
    'use cache';
    cacheTag('currencies');
    cacheLife('days');

    const db = await getAdminDb();

    const rates = await db.admin.query.exchangeRates.findMany({
      where: (exchangeRates, { eq }) => eq(exchangeRates.to, toCurrency),
    });

    const mapper = rates.reduce<CurrencyMapper>(
      (acc, rate) => {
        acc[rate.from] = rate.rate;
        return acc;
      },
      { [toCurrency]: 1 },
    );

    return mapper;
  },
);

/**
 * Returns the main currency and its mapper.
 *
 * @returns The main currency and its mapper.
 */
export const getMainCurrencyWithMapper = createApiQuery<
  void,
  {
    mainCurrency: string;
    mapper: CurrencyMapper;
  }
>(async () => {
  const profile = await getProfile();
  const mainCurrencyMapper = await getCurrencyMapper(profile.mainCurrency);

  return { mainCurrency: profile.mainCurrency, mapper: mainCurrencyMapper };
});
