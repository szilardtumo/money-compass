import { apiQueries } from '@/server/api/queries';

import { NetWorthHistoryCardClient } from './net-worth-history-card-client';

export async function NetWorthHistoryCard() {
  const [transactionHistory, accounts] = await Promise.all([
    apiQueries.transactions.getTransactionHistory({
      dateRange: '12 month',
      interval: '1 month',
    }),
    apiQueries.accounts.getAccounts(),
  ]);

  return <NetWorthHistoryCardClient transactionHistory={transactionHistory} accounts={accounts} />;
}
