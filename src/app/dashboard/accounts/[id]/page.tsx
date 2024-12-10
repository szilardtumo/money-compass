import { notFound } from 'next/navigation';

import { AccountDetailsCard } from '@/components/cards/account-details-card';
import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { SubaccountsCard } from '@/components/cards/subaccounts-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { apiQueries } from '@/server/api/queries';

import { AccountActionButtons } from './components/account-action-buttons';

interface AccountDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const { id } = await params;
  const account = await apiQueries.accounts.getAccount(id);

  if (!account) {
    notFound();
  }

  const [transactions, transactionHistory] = await Promise.all([
    apiQueries.transactions.getTransactions({ accountId: account.id, pageSize: 5 }),
    apiQueries.transactions.getTransactionHistory('12 month', '1 month'),
  ]);

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>{account.name}</PageHeaderTitle>
        <AccountActionButtons account={account} />
      </PageHeader>

      <PageContent>
        <AccountDetailsCard account={account} />
        <AccountHistoryCard
          data={transactionHistory}
          account={account}
          title="Transaction history (past 12 months)"
        />
        <SubaccountsCard subaccounts={account.subaccounts} accountBalance={account.totalBalance} />
        <RecentTransactionsCard
          accounts={[account]}
          transactions={transactions.data}
          mainCurrency={account.mainCurrency}
        />
      </PageContent>
    </PageLayout>
  );
}
