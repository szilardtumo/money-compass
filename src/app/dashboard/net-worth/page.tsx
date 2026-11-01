import { Suspense } from 'react';

import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { AccountsTrendCard } from './_components/accounts-trend-card';
import { CashRunwayCard } from './_components/cash-runway-card';
import { NetWorthChangesCard } from './_components/net-worth-changes-card';
import { StaleBalancesAlert } from './_components/stale-balances-alert';

export default function NetWorthPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Net worth</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense fallback={null}>
        <StaleBalancesAlert />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[360px]" />}>
        <NetWorthHistoryCard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[320px]" />}>
        <AccountsTrendCard />
      </Suspense>
      <div className="grid gap-4 lg:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-[360px] lg:col-span-2" />}>
          <NetWorthChangesCard className="lg:col-span-2" />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[360px]" />}>
          <CashRunwayCard />
        </Suspense>
      </div>
      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <AssetDistributionCard />
      </Suspense>
    </>
  );
}
