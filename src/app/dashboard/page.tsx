import { Suspense } from 'react';

import { AccountsCard } from '@/components/cards/accounts-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card/';
import { QuickActionsCard } from '@/components/cards/quick-actions-card';
import { RecentTransactionsCard } from '@/components/cards/recent-transactions-card';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default async function DashboardPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Dashboard</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense fallback={<Skeleton className="h-[360px]" />}>
        <NetWorthHistoryCard />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[220px]" />}>
        <QuickActionsCard />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <AccountsCard />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <RecentTransactionsCard />
      </Suspense>
    </>
  );
}
