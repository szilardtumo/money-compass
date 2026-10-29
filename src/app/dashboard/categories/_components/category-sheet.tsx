import { connection } from 'next/server';
import { z } from 'zod';

import { getPeriodRange, parsePeriod, shiftPeriod } from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

import { CategorySheetClient } from './category-sheet-client';

/**
 * The details of the category in the URL, with its merchants and its transactions of the last 12
 * months.
 */
export async function CategorySheet({
  searchParams,
}: {
  searchParams: PageProps<'/dashboard/categories'>['searchParams'];
}) {
  const categoryId = z.uuid().safeParse((await searchParams).category).data;
  if (!categoryId) {
    return null;
  }
  // The 12 months end today
  await connection();

  const [categories, merchants, transactions, accounts, profile] = await Promise.all([
    apiQueries.categories.getCategoriesWithStats(),
    apiQueries.categories.getCategoryMerchants({ categoryId }),
    apiQueries.transactions.getTransactions({
      categoryId,
      fromDate: getPeriodRange(shiftPeriod(parsePeriod(undefined), -11)).start.toISOString(),
      pageSize: 1000,
    }),
    apiQueries.accounts.getAccounts(),
    apiQueries.profiles.getProfile(),
  ]);
  // A deleted category closes the sheet
  const category = categories.find((item) => item.id === categoryId);
  if (!category) {
    return null;
  }

  return (
    <CategorySheetClient
      category={category}
      categories={categories}
      merchants={merchants}
      transactions={transactions.data}
      accounts={accounts}
      mainCurrency={profile.mainCurrency}
    />
  );
}
