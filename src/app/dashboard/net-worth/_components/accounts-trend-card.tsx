import { MONTHLY_HISTORY } from '@/components/cards/net-worth-history-card/net-worth-history-card';
import { apiQueries } from '@/server/api/queries';

import { AccountsTrendCardClient } from './accounts-trend-card-client';

/**
 * The accounts with their balance, share and trend over the range of the history card.
 */
export async function AccountsTrendCard() {
  const [accounts, history, { mainCurrency }] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactionHistory(MONTHLY_HISTORY),
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
      mainCurrency={mainCurrency}
    />
  );
}
