import { apiQueries } from '@/server/api/queries';

import { DividendsCardClient } from './dividends-card-client';

export async function DividendsCard() {
  const [dividends, { mainCurrency }] = await Promise.all([
    apiQueries.investments.getDividends(),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);

  return <DividendsCardClient dividends={dividends} mainCurrency={mainCurrency} />;
}
