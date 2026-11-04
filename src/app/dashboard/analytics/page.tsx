import { Suspense } from 'react';

import { TripSuggestions } from '@/components/trips/trip-suggestions';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { AnalyticsContent } from './_components/analytics-content';

export default function AnalyticsPage({ searchParams }: PageProps<'/dashboard/analytics'>) {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Analytics</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense fallback={null}>
        <TripSuggestions />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[720px]" />}>
        <AnalyticsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
