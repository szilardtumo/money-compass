import 'server-only';

import { connection } from 'next/server';

import { getLastMonths, getLastMonthsStart } from '@/lib/utils/periods';
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

  const [{ data: transactions }, accounts, profile] = await Promise.all([
    apiQueries.transactions.getTransactions({
      ...filter,
      fromDate: getLastMonthsStart().toISOString(),
      pageSize: 1000,
    }),
    apiQueries.accounts.getAccounts(),
    apiQueries.profiles.getProfile(),
  ]);

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
