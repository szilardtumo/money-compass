import { apiQueries } from '@/server/api/queries';

import { NetWorthChangesCardClient } from './net-worth-changes-card-client';

/**
 * The change of the net worth in each of the last 12 months, split into what was saved and the rest.
 */
export async function NetWorthChangesCard({ className }: { className?: string }) {
  const [history, cashFlow] = await Promise.all([
    apiQueries.transactions.getTransactionHistory(),
    apiQueries.analytics.getMonthlyCashFlow(),
  ]);
  const totals = new Map(
    history.map((item) => [new Date(item.date).toISOString().slice(0, 7), item.totalBalance]),
  );

  return (
    <NetWorthChangesCardClient
      className={className}
      mainCurrency={cashFlow.mainCurrency}
      months={cashFlow.months.slice(1).map((item, index) => {
        const saved = item.income - item.spending;
        const change =
          (totals.get(item.month) ?? 0) - (totals.get(cashFlow.months[index].month) ?? 0);
        return { month: item.month, saved, other: change - saved };
      })}
    />
  );
}
