import { apiQueries } from '@/server/api/queries';

import { RecentTransactionsCardClient } from './recent-transactions-card-client';

interface RecentTransactionsCardProps {
  accountId?: string;
}

export async function RecentTransactionsCard({ accountId }: RecentTransactionsCardProps) {
  const [accounts, transactions] = await Promise.all([
    accountId
      ? apiQueries.accounts.getAccount(accountId).then((account) => (account ? [account] : []))
      : apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactions({
      accountId,
      pageSize: 5,
    }),
  ]);

  return <RecentTransactionsCardClient transactions={transactions.data} accounts={accounts} />;
}
