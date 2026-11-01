import { connection } from 'next/server';

import { parseSubaccountsParam } from '@/lib/utils/params';
import { formatPeriodParam, parsePeriod } from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

import { AnalyticsParams } from './analytics-params';
import { AnalyticsView } from './analytics-view';

const getParam = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : undefined;

export async function AnalyticsContent({
  searchParams,
}: {
  searchParams: PageProps<'/dashboard/analytics'>['searchParams'];
}) {
  const query = await searchParams;
  // The default period and the Month tab depend on today
  await connection();
  const params: AnalyticsParams = {
    period: formatPeriodParam(parsePeriod(getParam(query.period))),
    view: getParam(query.view) === 'income' ? 'income' : 'spending',
    subaccountIds: parseSubaccountsParam(query.subaccounts),
  };
  const [analytics, accounts] = await Promise.all([
    apiQueries.analytics.getAnalytics({
      period: params.period,
      subaccountIds: params.subaccountIds,
    }),
    apiQueries.accounts.getAccounts(),
  ]);

  return <AnalyticsView analytics={analytics} accounts={accounts} params={params} />;
}
