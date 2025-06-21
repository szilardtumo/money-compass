import { Suspense } from 'react';

import { AssetDistributionCard } from '@/components/cards/asset-distribution-card';
import { NetWorthDifferenceCard } from '@/components/cards/net-worth-difference-card';
import { NetWorthHistoryCard } from '@/components/cards/net-worth-history-card';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default async function StatisticsPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Statistics</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense fallback={<Skeleton className="h-[360px]" />}>
        <NetWorthHistoryCard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[220px]" />}>
        <NetWorthDifferenceCard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <AssetDistributionCard />
      </Suspense>
    </>
  );
}
