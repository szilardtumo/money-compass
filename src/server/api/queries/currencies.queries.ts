import 'server-only';

import { CACHE_TAGS, cacheLife, cacheTag } from '@/lib/cache';
import { Currency, CurrencyMapper } from '@/lib/types/currencies.types';
import { createAuthenticatedApiQuery, createPublicApiQuery } from '@/server/api/create-api-query';
import { getAdminDb } from '@/server/db';

import { getProfile } from './profiles.queries';

export const getCurrencies = createPublicApiQuery<void, Currency[]>(async () => {
  'use cache';
  cacheTag.global(CACHE_TAGS.currencies);
  cacheLife('days');

  const db = await getAdminDb();

  return db.admin.query.currencies.findMany();
});

export const getCurrencyMapper = createPublicApiQuery<string, CurrencyMapper>(
  async ({ input: toCurrency }) => {
    'use cache';
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

export const getMainCurrencyWithMapper = createAuthenticatedApiQuery<
  void,
  {
    mainCurrency: string;
    mapper: CurrencyMapper;
  }
>(async ({ ctx }) => {
  const profile = await getProfile.withContext({ ctx });
  const mainCurrencyMapper = await getCurrencyMapper(profile.mainCurrency);

  return { mainCurrency: profile.mainCurrency, mapper: mainCurrencyMapper };
});
