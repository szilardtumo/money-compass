import { apiQueries } from '@/server/api/queries';

import { getDrawerData } from './drawer-data';
import { MerchantDrawerClient } from './merchant-drawer-client';

/**
 * The drawer of a merchant, with its names from the bank and its transactions of the last 12 months.
 */
export async function MerchantDrawer({ merchantId }: { merchantId: string }) {
  const [merchants, categories, data] = await Promise.all([
    apiQueries.merchants.getMerchants(),
    apiQueries.categories.getCategories(),
    getDrawerData({ merchantId }),
  ]);
  const merchant = merchants.find((item) => item.id === merchantId);
  // A merged merchant, or one without transactions, closes the drawer
  if (!merchant) {
    return null;
  }

  return (
    <MerchantDrawerClient
      merchant={merchant}
      merchants={merchants}
      categories={categories}
      {...data}
    />
  );
}
