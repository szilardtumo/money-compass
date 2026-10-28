import { apiQueries } from '@/server/api/queries';

import { CategoriesListClient } from './categories-list-client';

export async function CategoriesList() {
  const categories = await apiQueries.categories.getCategoriesWithCounts();

  return <CategoriesListClient categories={categories} />;
}
