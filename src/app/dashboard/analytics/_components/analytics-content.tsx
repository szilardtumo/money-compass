import { connection } from 'next/server';

import { parseSubaccountsParam } from '@/lib/utils/params';
import { formatPeriodParam, getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

import { AnalyticsParams } from './analytics-params';
import { AnalyticsView } from './analytics-view';

export async function AnalyticsContent({
  searchParams,
}: {
  searchParams: PageProps<'/dashboard/analytics'>['searchParams'];
}) {
  const query = await searchParams;
  // The default period and the Month tab depend on today
  await connection();
  const params: AnalyticsParams = {
    period: formatPeriodParam(
      parsePeriod(typeof query.period === 'string' ? query.period : undefined),
    ),
    subaccountIds: parseSubaccountsParam(query.subaccounts),
  };
  const { start, end } = getPeriodRange(parsePeriod(params.period));
  const [analytics, accounts, { data: transactions }, categories] = await Promise.all([
    apiQueries.analytics.getAnalytics({
      period: params.period,
      subaccountIds: params.subaccountIds,
    }),
    apiQueries.accounts.getAccounts(),
    apiQueries.transactions.getTransactions({
      subaccountIds: params.subaccountIds,
      fromDate: start.toISOString(),
      toDate: new Date(end.getTime() - 1).toISOString(),
      pageSize: 10_000,
    }),
    apiQueries.categories.getCategories(),
  ]);

  return (
    <AnalyticsView
      analytics={analytics}
      accounts={accounts}
      transactions={transactions.filter((transaction) => !transaction.excluded)}
      categories={categories}
      params={params}
    />
  );
}
