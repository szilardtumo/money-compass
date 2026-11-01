import { apiQueries } from '@/server/api/queries';

import { NetWorthHistoryCardClient } from './net-worth-history-card-client';

/** All of the history by month, for the ranges. The cards of the net worth page share it. */
export const MONTHLY_HISTORY = { dateRange: '30 year', interval: '1 month' } as const;

export async function NetWorthHistoryCard() {
  const [transactionHistory, accounts] = await Promise.all([
    apiQueries.transactions.getTransactionHistory(MONTHLY_HISTORY),
    apiQueries.accounts.getAccounts(),
  ]);

  return <NetWorthHistoryCardClient transactionHistory={transactionHistory} accounts={accounts} />;
}
