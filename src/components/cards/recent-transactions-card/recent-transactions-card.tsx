import { mainCurrency } from '@/lib/constants';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getCurrencyMapper } from '@/lib/db/currencies.queries';
import { getTransactions } from '@/lib/db/transactions.queries';

import { RecentTransactionsCardClient } from './recent-transactions-card-client';

export async function RecentTransactionsCard() {
  const [transactions, accounts, currencyMapper] = await Promise.all([
    getTransactions(),
    getSimpleAccounts(),
    getCurrencyMapper(mainCurrency),
  ]);

  return (
    <RecentTransactionsCardClient
      transactions={transactions.data}
      accounts={accounts}
      currencyMapper={currencyMapper}
    />
  );
}
