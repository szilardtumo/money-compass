import { apiQueries } from '@/server/api/queries';

import { getDrawerData } from './drawer-data';
import { MerchantDrawerClient } from './merchant-drawer-client';

/**
 * The drawer of a merchant, with its names from the bank and its transactions of the period.
 */
export async function MerchantDrawer({
  merchantId,
  period,
  subaccountIds,
}: {
  merchantId: string;
  period: string | undefined;
  subaccountIds: string[] | undefined;
}) {
  const [merchants, categories, data] = await Promise.all([
    apiQueries.merchants.getMerchants(),
    apiQueries.categories.getCategories(),
    getDrawerData({ merchantId }, period, subaccountIds),
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
      period={period}
    />
  );
}
