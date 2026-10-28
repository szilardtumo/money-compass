import { apiQueries } from '@/server/api/queries';

import { MerchantsTableClient } from './merchants-table-client';

export async function MerchantsTable() {
  const [merchants, categories, profile] = await Promise.all([
    apiQueries.merchants.getMerchants(),
    apiQueries.categories.getCategories(),
    apiQueries.profiles.getProfile(),
  ]);

  return (
    <MerchantsTableClient
      merchants={merchants}
      categories={categories}
      mainCurrency={profile.mainCurrency}
    />
  );
}
