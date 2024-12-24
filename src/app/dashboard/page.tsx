import { AccountsCard } from '@/components/cards/accounts-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { apiQueries } from '@/server/api/queries';

export default async function DashboardPage() {
  const [accounts, transactionHistory, transactions, { mainCurrency }] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactionHistory({ dateRange: '12 month', interval: '1 month' }),
    apiQueries.transactions.getTransactions({ pageSize: 5 }),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Dashboard</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <NetWorthHistoryCard accounts={accounts} data={transactionHistory} />

        <QuickActionsCard />

        <AccountsCard />

        <RecentTransactionsCard
          accounts={accounts}
          transactions={transactions.data}
          mainCurrency={mainCurrency}
        />
      </PageContent>
    </PageLayout>
  );
}
