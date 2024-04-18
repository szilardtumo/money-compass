import { notFound } from 'next/navigation';

import { AccountDetailsCard } from '@/components/cards/account-details-card';
import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { mainCurrency } from '@/lib/constants';
import { getSimpleAccount } from '@/lib/db/accounts.queries';
import { getCurrencyMapper } from '@/lib/db/currencies.queries';
import { getTransactionHistory, getTransactions } from '@/lib/db/transactions.queries';

import { AccountActionButtons } from './components/account-action-buttons';

interface AccountDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const account = await getSimpleAccount(params.id);

  if (!account) {
    notFound();
  }

  const [transactions, transactionHistory, currencyMapper] = await Promise.all([
    getTransactions({ subaccountId: account?.subaccountId, pageSize: 5 }),
    getTransactionHistory('12 month', '1 month'),
    getCurrencyMapper(mainCurrency),
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
          currencyMapper={currencyMapper}
        />
      </PageContent>
    </PageLayout>
  );
}
