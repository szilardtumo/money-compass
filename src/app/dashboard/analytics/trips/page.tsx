import { Suspense } from 'react';

import { TripSuggestions } from '@/components/trips/trip-suggestions';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { TripsList } from './_components/trips-list';

export default function TripsPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Trips</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense fallback={null}>
        <TripSuggestions />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[650px] w-full" />}>
        <TripsList />
      </Suspense>
    </>
  );
}
