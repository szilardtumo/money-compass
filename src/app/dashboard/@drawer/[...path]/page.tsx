import { connection } from 'next/server';
import { Suspense } from 'react';
import { z } from 'zod';

import { parseSubaccountsParam } from '@/lib/utils/params';
import { formatPeriodParam, isPeriodParam, parsePeriod } from '@/lib/utils/periods';

import { AccountDrawer } from '../_components/account-drawer';
import { CategoryDrawer } from '../_components/category-drawer';
import { MerchantDrawer } from '../_components/merchant-drawer';
import { TripDrawer } from '../_components/trip-drawer';

/**
 * The drawer of the category, merchant, account or trip in the URL, for its period, on every dashboard page. It
 * matches every path, so it renders again on each navigation and closes when the param is gone.
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
  // The analytics page shares them, so its period and accounts show in the drawer too
  await connection();
  const period = isPeriodParam(query.period)
    ? query.period
    : formatPeriodParam(parsePeriod(undefined));
  const subaccountIds = parseSubaccountsParam(query.subaccounts);
  const accountId = z.uuid().safeParse(query.account).data;
  if (accountId) {
    return <AccountDrawer accountId={accountId} period={period} />;
  }
  const tripId = z.uuid().safeParse(query.trip).data;
  if (tripId) {
    return <TripDrawer tripId={tripId} />;
  }
  const merchantId = z.uuid().safeParse(query.merchant).data;
  if (merchantId) {
    return (
      <MerchantDrawer
        merchantId={merchantId}
        period={period}
        subaccountIds={subaccountIds}
        allTime={query.history === 'all'}
      />
    );
  }
  if (query.category === 'uncategorized') {
    return <CategoryDrawer categoryId={null} period={period} subaccountIds={subaccountIds} />;
  }
  const categoryId = z.uuid().safeParse(query.category).data;
  return categoryId ? (
    <CategoryDrawer categoryId={categoryId} period={period} subaccountIds={subaccountIds} />
  ) : null;
}
