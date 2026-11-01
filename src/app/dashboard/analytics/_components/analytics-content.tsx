import { connection } from 'next/server';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { parseSubaccountsParam } from '@/lib/utils/params';
import { formatPeriodParam, getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

import { AnalyticsParams } from './analytics-params';
import { AnalyticsView } from './analytics-view';
import { TransactionsSheet } from './transactions-sheet';

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
    excluded: getParam(query.excluded) === '1',
  };

  // Siblings, so the analytics and the sheet's transactions load in parallel
  return (
    <>
      <Suspense fallback={<Skeleton className="h-[720px]" />}>
        <AnalyticsData params={params} />
      </Suspense>
      {params.excluded && (
        <Suspense fallback={null}>
          <TransactionsSheetContent params={params} />
        </Suspense>
      )}
    </>
  );
}

async function AnalyticsData({ params }: { params: AnalyticsParams }) {
  const [analytics, accounts] = await Promise.all([
    apiQueries.analytics.getAnalytics({
      period: params.period,
      subaccountIds: params.subaccountIds,
    }),
    apiQueries.accounts.getAccounts(),
  ]);

  return <AnalyticsView analytics={analytics} accounts={accounts} params={params} />;
}

async function TransactionsSheetContent({ params }: { params: AnalyticsParams }) {
  const { start, end } = getPeriodRange(parsePeriod(params.period));
  const [transactions, categories, accounts] = await Promise.all([
    apiQueries.transactions.getTransactions({
      fromDate: start.toISOString(),
      toDate: new Date(end.getTime() - 1).toISOString(),
      side: 'excluded',
      subaccountIds: params.subaccountIds,
      // One more than shown, to tell whether the list is cut
      pageSize: 501,
    }),
    apiQueries.categories.getCategories(),
    apiQueries.accounts.getAccounts(),
  ]);

  return (
    <TransactionsSheet
      params={params}
      transactions={transactions.data.slice(0, 500)}
      isCut={transactions.data.length > 500}
      accounts={accounts}
      categories={categories}
    />
  );
}
