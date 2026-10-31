import 'server-only';

import { connection } from 'next/server';

import { getLastMonths, getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

/**
 * Loads what every drawer shows: the transactions of the last 12 months that match the filter, their
 * monthly totals in the main currency, and the accounts of the list.
 */
export async function getDrawerData(
  filter: { categoryId: string | null } | { merchantId: string },
) {
  // The 12 months end today
  await connection();
  const months = getLastMonths();

  const [{ data }, accounts, profile] = await Promise.all([
    apiQueries.transactions.getTransactions({
      ...filter,
      fromDate: getPeriodRange(parsePeriod(months[0])).start.toISOString(),
      pageSize: 1000,
    }),
    apiQueries.accounts.getAccounts(),
    apiQueries.profiles.getProfile(),
  ]);
  // Exchanges, top-ups and corrections have no category, but they don't wait for one either
  const transactions =
    'categoryId' in filter && !filter.categoryId ? data.filter((item) => !item.excluded) : data;

  return {
    transactions,
    monthlyTotals: months.map((month) =>
      transactions
        .filter((item) => new Date(item.startedDate).toISOString().startsWith(month))
        .reduce((total, item) => total + item.amount.mainCurrencyValue, 0),
    ),
    accounts,
    mainCurrency: profile.mainCurrency,
  };
}
