import { apiQueries } from '@/server/api/queries';

import { RecentTransactionsCardClient } from './recent-transactions-card-client';

export async function RecentTransactionsCard() {
  const [accounts, transactions, categories] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactions({ pageSize: 5 }),
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
