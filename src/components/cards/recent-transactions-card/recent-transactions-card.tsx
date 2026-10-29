import { apiQueries } from '@/server/api/queries';

import { RecentTransactionsCardClient } from './recent-transactions-card-client';

interface RecentTransactionsCardProps {
  accountId?: string;
}

export async function RecentTransactionsCard({ accountId }: RecentTransactionsCardProps) {
  const [accounts, transactions, categories] = await Promise.all([
    accountId
      ? apiQueries.accounts.getAccount(accountId).then((account) => (account ? [account] : []))
      : apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactions({
      accountId,
      pageSize: 5,
    }),
    apiQueries.categories.getCategories(),
  ]);

  return (
    <RecentTransactionsCardClient
      transactions={transactions.data}
      accounts={accounts}
      categories={categories}
    />
  );
}
