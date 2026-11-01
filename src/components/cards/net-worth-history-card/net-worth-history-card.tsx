import { apiQueries } from '@/server/api/queries';

import { NetWorthHistoryCardClient } from './net-worth-history-card-client';

export async function NetWorthHistoryCard() {
  const [transactionHistory, accounts] = await Promise.all([
    apiQueries.transactions.getTransactionHistory({
      // All of it, for the ranges of the card
      dateRange: '30 year',
      interval: '1 month',
    }),
    apiQueries.accounts.getAccounts(),
  ]);

  return <NetWorthHistoryCardClient transactionHistory={transactionHistory} accounts={accounts} />;
}
