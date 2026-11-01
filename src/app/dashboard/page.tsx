import { Suspense } from 'react';

import { NetWorthSummaryCard } from '@/components/cards/net-worth-summary-card';
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

      <Suspense fallback={<Skeleton className="h-[140px]" />}>
        <NetWorthSummaryCard />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[220px]" />}>
        <QuickActionsCard />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <RecentTransactionsCard />
      </Suspense>
    </>
  );
}
