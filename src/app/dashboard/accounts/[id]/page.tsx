import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AccountDetailsCard } from '@/components/cards/account-details-card';
import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { SubaccountsCard } from '@/components/cards/subaccounts-card';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { apiQueries } from '@/server/api/queries';

import { AccountActionButtons } from './_components/account-action-buttons';

interface AccountDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const { id } = await params;

  // Only fetch the minimal account data needed for the page header and to verify existence
  const account = await apiQueries.accounts.getAccount(id);

  if (!account) {
    notFound();
  }

  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>{account.name}</PageHeaderTitle>
        <AccountActionButtons account={account} />
      </PageHeaderSlotContent>

      <Suspense fallback={<Skeleton className="h-[100px]" />}>
        <AccountDetailsCard accountId={id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[360px]" />}>
        <AccountHistoryCard accountId={id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[500px]" />}>
        <SubaccountsCard accountId={id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[500px]" />}>
        <RecentTransactionsCard accountId={id} />
      </Suspense>
    </>
  );
}
