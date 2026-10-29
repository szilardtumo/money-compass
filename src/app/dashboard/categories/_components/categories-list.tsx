import { apiQueries } from '@/server/api/queries';

import { CategoriesListClient } from './categories-list-client';

export async function CategoriesList() {
  const [categories, profile] = await Promise.all([
    apiQueries.categories.getCategoriesWithStats(),
    apiQueries.profiles.getProfile(),
  ]);

  return <CategoriesListClient categories={categories} mainCurrency={profile.mainCurrency} />;
}
