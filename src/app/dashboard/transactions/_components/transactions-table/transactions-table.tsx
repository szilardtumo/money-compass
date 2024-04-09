import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getTransactions } from '@/lib/db/transactions.queries';

import { TransactionsTableClient } from './transactions-table-client';

export async function TransactionsTable() {
  const [accounts, transactions] = await Promise.all([
    getSimpleAccounts(),
    getTransactions({ pageSize: 1000 }),
  ]);

  return <TransactionsTableClient accounts={accounts} transactions={transactions} />;
}
