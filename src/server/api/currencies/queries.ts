import 'server-only';

import { createAuthenticatedApiQuery, createPublicApiQuery } from '@/lib/api';
import { CACHE_TAGS, cacheLife, cacheTag } from '@/lib/api/cache';
import { Currency, CurrencyMapper } from '@/lib/types/currencies.types';
import { getAdminDb } from '@/server/db';

import { getProfile } from '../profiles/queries';

/**
 * Returns all currencies from the database.
 *
 * @returns All currencies from the database.
 */
export const getCurrencies = createPublicApiQuery<void, Currency[]>(async () => {
  'use cache';
  cacheTag.global(CACHE_TAGS.currencies);
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
export const getCurrencyMapper = createPublicApiQuery<string, CurrencyMapper>(
  async ({ input: toCurrency }) => {
    'use cache';
    cacheTag.global(CACHE_TAGS.currencies);
    cacheTag.id(toCurrency, CACHE_TAGS.currencyMappers);
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
export const getMainCurrencyWithMapper = createAuthenticatedApiQuery<
  void,
  {
    mainCurrency: string;
    mapper: CurrencyMapper;
  }
>(async ({ ctx }) => {
  // Profile and currencyMapper are both cached, don't cache this query

  const profile = await getProfile.withContext({ ctx });
  const mainCurrencyMapper = await getCurrencyMapper(profile.mainCurrency);

  return { mainCurrency: profile.mainCurrency, mapper: mainCurrencyMapper };
});
