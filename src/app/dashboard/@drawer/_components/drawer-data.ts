import 'server-only';

import { connection } from 'next/server';

import {
  formatPeriodParam,
  getChartMonths,
  getPeriodOrLastMonthsRange,
  getPeriodRange,
  parsePeriod,
} from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

/**
 * Loads what every drawer shows: the transactions of the period that match the filter, their total,
 * and the monthly totals and average of the period's year, or of the last 12 months, in the main
 * currency, and the accounts of the list.
 *
 * @param period Like "2026-10" or "2026", else the last 12 months
 */
export async function getDrawerData(
  filter: { categoryId: string | null } | { merchantId: string },
  period: string | undefined,
) {
  // Without a period, the 12 months end today
  await connection();
  const months = getChartMonths(period);
  const { start, end } = getPeriodOrLastMonthsRange(period);
  const currentMonth = formatPeriodParam(parsePeriod(undefined));

  const [{ data }, accounts, profile] = await Promise.all([
    apiQueries.transactions.getTransactions({
      ...filter,
      fromDate: getPeriodRange(parsePeriod(months[0])).start.toISOString(),
      toDate: new Date(getPeriodRange(parsePeriod(months[11])).end.getTime() - 1).toISOString(),
      pageSize: 1000,
    }),
    apiQueries.accounts.getAccounts(),
    apiQueries.profiles.getProfile(),
  ]);
  // The chart shows the whole year of a month
  const transactions = data.filter((item) => {
    const date = new Date(item.startedDate);
    return date >= start && date < end;
  });
  const monthlyTotals = months.map((month) =>
    data
      .filter((item) => new Date(item.startedDate).toISOString().startsWith(month))
      .reduce((total, item) => total + item.amount.mainCurrencyValue, 0),
  );

  return {
    transactions,
    total: transactions.reduce((total, item) => total + item.amount.mainCurrencyValue, 0),
    monthlyTotals,
    // This year's months to come don't count
    average:
      monthlyTotals.reduce((total, value) => total + value, 0) /
      Math.max(months.filter((month) => month <= currentMonth).length, 1),
    accounts,
    mainCurrency: profile.mainCurrency,
  };
}
