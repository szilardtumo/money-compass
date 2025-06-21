import { apiQueries } from '@/server/api/queries';

import { AccountHistoryCardClient } from './account-history-card-client';

interface AccountHistoryCardProps {
  accountId: string;
}

export async function AccountHistoryCard({ accountId }: AccountHistoryCardProps) {
  const [account, transactionHistory] = await Promise.all([
    apiQueries.accounts.getAccount(accountId),
    apiQueries.transactions.getTransactionHistory({
      dateRange: '12 month',
      interval: '1 month',
    }),
  ]);

  if (!account) return null;

  return (
    <AccountHistoryCardClient
      title="Transaction history (past 12 months)"
      transactionHistory={transactionHistory}
      account={account}
    />
  );
}
