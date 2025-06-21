import { redirect } from 'next/navigation';

import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { AccountsCard } from '@/components/cards/accounts-card';
import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthDifferenceCard } from '@/components/cards/net-worth-difference-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { QuickActionsCard } from '@/components/cards/quick-actions-card/quick-actions-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { apiQueries } from '@/server/api/queries';

import { DataTableTest } from './_components/data-table-test';
import { RecalculateBalances } from './_components/recalculate-balances';

export default async function TestPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/dashboard');
  }

  const [accounts, transactions] = await Promise.all([
    apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactions(),
  ]);

  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Test page</PageHeaderTitle>
      </PageHeaderSlotContent>

      <RecalculateBalances />

      <NetWorthHistoryCard />

      {!!accounts[0] && <AccountHistoryCard accountId={accounts[0].id} />}

      <AssetDistributionCard />

      <NetWorthDifferenceCard />

      <QuickActionsCard />

      <AccountsCard />

      <RecentTransactionsCard />

      <DataTableTest accounts={accounts} transactions={transactions} />
    </>
  );
}
