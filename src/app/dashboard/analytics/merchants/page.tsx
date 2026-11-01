import Link from 'next/link';
import { Suspense } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { MerchantsTable } from './_components/merchants-table';

export default function MerchantsPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Merchants</PageHeaderTitle>
        <Link
          href="/dashboard/analytics/categories"
          className={buttonVariants({ variant: 'outline' })}
        >
          Categories
        </Link>
      </PageHeaderSlotContent>

      <Suspense fallback={<Skeleton className="h-[650px] w-full" />}>
        <MerchantsTable />
      </Suspense>
    </>
  );
}
