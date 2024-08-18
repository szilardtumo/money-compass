import { notFound } from 'next/navigation';

import { AccountDetailsCard } from '@/components/cards/account-details-card';
import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { apiQueries } from '@/server/api/queries';

import { AccountActionButtons } from './components/account-action-buttons';

interface AccountDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const account = await apiQueries.accounts.getSimpleAccount(params.id);

  if (!account) {
    notFound();
  }

  const [transactions, transactionHistory] = await Promise.all([
    apiQueries.transactions.getTransactions({ subaccountId: account?.subaccountId, pageSize: 5 }),
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
        <RecentTransactionsCard
          accounts={[account]}
          transactions={transactions.data}
          mainCurrency={account.mainCurrency}
        />
      </PageContent>
    </PageLayout>
  );
}
