import { apiQueries } from '@/server/api/queries';

import { AccountsTrendCardClient } from './accounts-trend-card-client';
import { getStaleSubaccounts } from './get-stale-subaccounts';

/**
 * The accounts with their balance, share and trend over the range of the history card.
 */
export async function AccountsTrendCard() {
  const [accounts, history, stale, { mainCurrency }] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    // The same as the history card's, so it loads once
    apiQueries.transactions.getTransactionHistory({ dateRange: '30 year', interval: '1 month' }),
    getStaleSubaccounts(),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);

  return (
    <AccountsTrendCardClient
      accounts={accounts}
      history={history.map((item) =>
        Object.fromEntries(
          Object.entries(item.accountBalances).map(([id, balance]) => [id, balance.totalBalance]),
        ),
      )}
      firstDate={history[0]?.date}
      staleDays={Object.fromEntries(stale.map((item) => [item.accountId, item.days]))}
      mainCurrency={mainCurrency}
    />
  );
}
