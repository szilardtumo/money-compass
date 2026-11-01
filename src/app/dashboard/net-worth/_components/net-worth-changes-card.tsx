import { getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

import { NetWorthChangesCardClient } from './net-worth-changes-card-client';

/**
 * The change of the net worth in each month, split into what was saved and the rest.
 */
export async function NetWorthChangesCard({ className }: { className?: string }) {
  const history = await apiQueries.transactions.getTransactionHistory();
  if (!history.length) {
    return null;
  }

  const months = history.map((item) => new Date(item.date).toISOString().slice(0, 7));
  const { mainCurrency, totals } = await apiQueries.analytics.getTotals({
    from: getPeriodRange(parsePeriod(months[0])).start.toISOString(),
    to: getPeriodRange(parsePeriod(months.at(-1))).end.toISOString(),
    bucket: 'month',
  });
  const saved = new Map<string, number>();
  for (const row of totals) {
    if (row.side !== 'excluded') {
      saved.set(row.bucket, (saved.get(row.bucket) ?? 0) + row.amount);
    }
  }

  return (
    <NetWorthChangesCardClient
      className={className}
      mainCurrency={mainCurrency}
      firstDate={history[0].date}
      months={history.map((item, index) => {
        const monthSaved = saved.get(months[index]) ?? 0;
        const change = item.totalBalance - (history[index - 1]?.totalBalance ?? 0);
        return { month: months[index], saved: monthSaved, other: change - monthSaved };
      })}
    />
  );
}
