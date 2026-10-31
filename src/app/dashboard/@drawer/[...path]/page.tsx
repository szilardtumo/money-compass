import { Suspense } from 'react';
import { z } from 'zod';

import { CategoryDrawer } from '../_components/category-drawer';
import { MerchantDrawer } from '../_components/merchant-drawer';

/**
 * The drawer of the category or merchant in the URL, on every dashboard page. It matches every
 * path, so it renders again on each navigation and closes when the param is gone.
 */
export default function DrawerPage({ searchParams }: PageProps<'/dashboard/[...path]'>) {
  return (
    <Suspense fallback={null}>
      <Drawer searchParams={searchParams} />
    </Suspense>
  );
}

async function Drawer({
  searchParams,
}: {
  searchParams: PageProps<'/dashboard/[...path]'>['searchParams'];
}) {
  const query = await searchParams;
  const merchantId = z.uuid().safeParse(query.merchant).data;
  if (merchantId) {
    return <MerchantDrawer merchantId={merchantId} />;
  }
  if (query.category === 'uncategorized') {
    return <CategoryDrawer categoryId={null} />;
  }
  const categoryId = z.uuid().safeParse(query.category).data;
  return categoryId ? <CategoryDrawer categoryId={categoryId} /> : null;
}
