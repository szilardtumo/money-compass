import { ChartCandlestickIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import {
  PlaceholderArea,
  PlaceholderAreaDescription,
  PlaceholderAreaTitle,
} from '@/components/ui/placeholder-area';
import { Skeleton } from '@/components/ui/skeleton';
import { apiQueries } from '@/server/api/queries';

import { AllocationCard } from './_components/allocation-card';
import { HoldingsCard } from './_components/holdings-card';
import { PortfolioHistoryCard } from './_components/portfolio-history-card';
import { PortfolioMetrics } from './_components/portfolio-metrics';

export default function InvestmentsPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Investments</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense
        fallback={
          <>
            <Skeleton className="h-[260px]" />
            <Skeleton className="h-[360px]" />
          </>
        }
      >
        <InvestmentsOverview />
      </Suspense>
    </>
  );
}

async function InvestmentsOverview() {
  const summary = await apiQueries.investments.getPortfolioSummary();

  if (!summary) {
    return (
      <PlaceholderArea className="h-72">
        <ChartCandlestickIcon className="size-10 text-muted-foreground" />
        <PlaceholderAreaTitle>No investments yet</PlaceholderAreaTitle>
        <PlaceholderAreaDescription>
          Connect IBKR to see your holdings, their value and your allocation.
        </PlaceholderAreaDescription>
        <Link href="/dashboard/integrations" className={buttonVariants()}>
          Go to integrations
        </Link>
      </PlaceholderArea>
    );
  }

  return (
    <>
      <PortfolioMetrics summary={summary} />
      <Suspense fallback={<Skeleton className="h-[360px]" />}>
        <PortfolioHistoryCard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <HoldingsCard />
      </Suspense>
      <AllocationCard summary={summary} />
    </>
  );
}
