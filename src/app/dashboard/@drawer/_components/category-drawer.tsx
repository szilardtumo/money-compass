import { apiQueries } from '@/server/api/queries';

import { CategoryDrawerClient } from './category-drawer-client';
import { getDrawerData } from './drawer-data';

/**
 * The drawer of a category, or of the uncategorized transactions for null, with its merchants and
 * its transactions of the period.
 */
export async function CategoryDrawer({
  categoryId,
  period,
  subaccountIds,
}: {
  categoryId: string | null;
  period: string | undefined;
  subaccountIds: string[] | undefined;
}) {
  const [categories, merchants, data] = await Promise.all([
    apiQueries.categories.getCategoriesWithStats(),
    apiQueries.categories.getCategoryMerchants({ categoryId, period, subaccountIds }),
    getDrawerData({ categoryId }, period, subaccountIds),
  ]);
  const category = categories.find((item) => item.id === categoryId) ?? null;
  // A deleted category closes the drawer
  if (categoryId && !category) {
    return null;
  }

  return (
    <CategoryDrawerClient
      category={category}
      categories={categories}
      merchants={merchants}
      {...data}
      period={period}
    />
  );
}
