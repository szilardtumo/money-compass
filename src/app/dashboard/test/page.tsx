import { DataTableTest } from '@/app/dashboard/test/_components/data-table-test';
import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { AccountsCard } from '@/components/cards/accounts-card';
import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card/quick-actions-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageHeader, PageHeaderTitle } from '@/components/ui/page-header';
import { mainCurrency } from '@/lib/constants';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getCurrencyMapper } from '@/lib/db/currencies.queries';
import { getTransactionHistory, getTransactions } from '@/lib/db/transactions.queries';

export default async function TestPage() {
  const [accounts, transactionHistory, transactions, currencyMapper] = await Promise.all([
    getSimpleAccounts(),
    getTransactionHistory('12 month', '1 month'),
    getTransactions(),
    getCurrencyMapper(mainCurrency),
  ]);

  return (
    <main>
      <PageHeader>
        <PageHeaderTitle>Test page</PageHeaderTitle>
      </PageHeader>

      <div className="m-4 flex flex-col gap-4">
        <NetWorthHistoryCard data={transactionHistory} accounts={accounts} />

        <AccountHistoryCard data={transactionHistory} account={accounts[0]} />

        <AssetDistributionCard accounts={accounts} currencyMapper={currencyMapper} />

        <QuickActionsCard />

        <AccountsCard accounts={accounts} />

        <RecentTransactionsCard
          accounts={accounts}
          transactions={transactions.data}
          currencyMapper={currencyMapper}
        />

        <DataTableTest accounts={accounts} transactions={transactions} />
      </div>
    </main>
  );
}
