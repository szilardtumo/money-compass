import { AccountsCard } from '@/components/cards/accounts-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';
import { getTransactionHistory, getTransactions } from '@/lib/db/transactions.queries';

export default async function DashboardPage() {
  const [accounts, transactionHistory, transactions] = await Promise.all([
    getSimpleAccounts(),
    getTransactionHistory('12 month', '1 month'),
    getTransactions({ pageSize: 5 }),
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

        <RecentTransactionsCard accounts={accounts} transactions={transactions.data} />
      </PageContent>
    </PageLayout>
  );
}
