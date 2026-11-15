import { apiQueries } from '@/server/api/queries';

import { PortfolioHistoryCardClient } from './portfolio-history-card-client';

export async function PortfolioHistoryCard() {
  const [history, { mainCurrency }] = await Promise.all([
    apiQueries.investments.getPortfolioHistory(),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);

  return <PortfolioHistoryCardClient history={history} mainCurrency={mainCurrency} />;
}
