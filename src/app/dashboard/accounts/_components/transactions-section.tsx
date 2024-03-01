import { TransactionsList } from '@/app/dashboard/accounts/_components/transactions-list';
import { mainCurrency } from '@/lib/constants';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getCurrencyMapper } from '@/lib/db/currencies.queries';
import { getTransactions } from '@/lib/db/transactions.queries';

export async function TransactionsSection() {
  const [transactions, accounts, currencyMapper] = await Promise.all([
    getTransactions(),
    getSimpleAccounts(),
    getCurrencyMapper(mainCurrency),
  ]);

  return (
    <TransactionsList
      transactions={transactions.data}
      accounts={accounts}
      currencyMapper={currencyMapper}
    />
  );
}
