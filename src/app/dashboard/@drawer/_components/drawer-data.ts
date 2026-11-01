import 'server-only';

import { connection } from 'next/server';

import {
  formatPeriodLabel,
  formatPeriodParam,
  getChartMonths,
  getPeriodRange,
  parsePeriod,
} from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

/**
 * Loads what every drawer shows: the transactions of the period that match the filter, their total,
 * and the monthly totals and average of the period's year in the main currency, and the accounts of
 * the list.
 *
 * @param period Like "2026-10" or "2026"
 * @param subaccountIds Only the transactions of these subaccounts, else of all
 */
export async function getDrawerData(
  filter: { categoryId: string | null } | { merchantId: string },
  period: string,
  subaccountIds: string[] | undefined,
) {
  // The average counts this year's months so far
  await connection();
  const { start, end } = getPeriodRange(parsePeriod(period));
  const year = getPeriodRange(parsePeriod(String(parsePeriod(period).year)));
  const months = getChartMonths(period);
  const currentMonth = formatPeriodParam(parsePeriod(undefined));

  const [{ data: transactions }, { mainCurrency, totals }, accounts] = await Promise.all([
    apiQueries.transactions.getTransactions({
      ...filter,
      subaccountIds,
      fromDate: start.toISOString(),
      toDate: new Date(end.getTime() - 1).toISOString(),
      pageSize: 10_000,
    }),
    apiQueries.analytics.getTotals({
      ...filter,
      subaccountIds,
      from: year.start.toISOString(),
      to: year.end.toISOString(),
      bucket: 'month',
    }),
    apiQueries.accounts.getAccounts(),
  ]);
  const monthlyTotals = months.map((month) =>
    totals.filter((row) => row.bucket === month).reduce((total, row) => total + row.amount, 0),
  );

  return {
    transactions,
    stats: [
      {
        label: formatPeriodLabel(parsePeriod(period)),
        value: monthlyTotals.reduce(
          (total, value, index) => (months[index].startsWith(period) ? total + value : total),
          0,
        ),
      },
      {
        label: `Monthly average in ${parsePeriod(period).year}`,
        // This year's months to come don't count
        value:
          monthlyTotals.reduce((total, value) => total + value, 0) /
          Math.max(months.filter((month) => month <= currentMonth).length, 1),
      },
    ],
    chart: monthlyTotals,
    accounts,
    mainCurrency,
  };
}
