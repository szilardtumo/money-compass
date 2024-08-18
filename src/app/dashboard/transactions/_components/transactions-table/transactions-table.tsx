import { apiQueries } from '@/server/api/queries';

import { TransactionsTableClient } from './transactions-table-client';

export async function TransactionsTable() {
  const [accounts, transactions] = await Promise.all([
    apiQueries.accounts.getSimpleAccounts(),
    apiQueries.transactions.getTransactions({ pageSize: 1000 }),
  ]);

  return <TransactionsTableClient accounts={accounts} transactions={transactions} />;
}
