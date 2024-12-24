import { redirect } from 'next/navigation';

import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { AccountsCard } from '@/components/cards/accounts-card';
import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthDifferenceCard } from '@/components/cards/net-worth-difference-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card/quick-actions-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { apiQueries } from '@/server/api/queries';

import { DataTableTest } from './_components/data-table-test';
import { RecalculateBalances } from './_components/recalculate-balances';

export default async function TestPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/dashboard');
  }

  const [accounts, transactionHistory, transactions, { mainCurrency }] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactionHistory({ dateRange: '12 month', interval: '1 month' }),
    apiQueries.transactions.getTransactions(),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Test page</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <RecalculateBalances />

        <NetWorthHistoryCard data={transactionHistory} accounts={accounts} />

        {!!accounts[0] && <AccountHistoryCard data={transactionHistory} account={accounts[0]} />}

        <AssetDistributionCard accounts={accounts} mainCurrency={mainCurrency} />

        <NetWorthDifferenceCard data={transactionHistory} />

        <QuickActionsCard />

        <AccountsCard />

        <RecentTransactionsCard
          accounts={accounts}
          transactions={transactions.data}
          mainCurrency={mainCurrency}
        />

        <DataTableTest accounts={accounts} transactions={transactions} />
      </PageContent>
    </PageLayout>
  );
}
