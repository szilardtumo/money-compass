import { Suspense } from 'react';

import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

import { CategoriesList } from './_components/categories-list';

export default function CategoriesPage() {
  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Categories</PageHeaderTitle>
      </PageHeaderSlotContent>

      <Suspense fallback={<Skeleton className="h-[650px] w-full" />}>
        <CategoriesList />
      </Suspense>
    </>
  );
}
