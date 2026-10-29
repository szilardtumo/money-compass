import { connection } from 'next/server';
import { Suspense } from 'react';
import { z } from 'zod';

import { Skeleton } from '@/components/ui/skeleton';
import { formatPeriodParam, getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

import { AnalyticsParams } from './analytics-params';
import { AnalyticsView } from './analytics-view';
import { TransactionsSheet } from './transactions-sheet';

const getParam = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : undefined;

const getId = (value: string | string[] | undefined) => z.uuid().safeParse(value).data;

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
    category:
      getParam(query.category) === 'uncategorized' ? 'uncategorized' : getId(query.category),
    merchant: getId(query.merchant),
    excluded: getParam(query.excluded) === '1',
  };

  const hasSheet = !!(params.category || params.merchant || params.excluded);

  // Siblings, so the analytics and the sheet's transactions load in parallel
  return (
    <>
      <Suspense fallback={<Skeleton className="h-[720px]" />}>
        <AnalyticsData params={params} currentMonth={formatPeriodParam(parsePeriod(undefined))} />
      </Suspense>
      {hasSheet && (
        <Suspense fallback={null}>
          <TransactionsSheetContent params={params} />
        </Suspense>
      )}
    </>
  );
}

async function AnalyticsData({
  params,
  currentMonth,
}: {
  params: AnalyticsParams;
  currentMonth: string;
}) {
  const analytics = await apiQueries.analytics.getAnalytics({ period: params.period });

  return <AnalyticsView analytics={analytics} params={params} currentMonth={currentMonth} />;
}

async function TransactionsSheetContent({ params }: { params: AnalyticsParams }) {
  const { start, end } = getPeriodRange(parsePeriod(params.period));
  const [transactions, categories, accounts] = await Promise.all([
    apiQueries.transactions.getTransactions({
      fromDate: start.toISOString(),
      toDate: new Date(end.getTime() - 1).toISOString(),
      categoryId: params.category === 'uncategorized' ? null : params.category,
      merchantId: params.merchant,
      side: params.excluded ? 'excluded' : params.view,
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
