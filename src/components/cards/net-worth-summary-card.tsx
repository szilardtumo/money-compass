import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Metric } from '@/components/ui/metric';
import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { TrendLine } from '@/components/ui/trend-line';
import { formatCurrency } from '@/lib/utils/formatters';
import { apiQueries } from '@/server/api/queries';

/**
 * The net worth now, its change this month and its last 12 months, with a link to the net worth page.
 */
export async function NetWorthSummaryCard() {
  const [history, { mainCurrency }] = await Promise.all([
    apiQueries.transactions.getTransactionHistory(),
    apiQueries.currencies.getMainCurrencyWithMapper(),
  ]);
  const values = history.slice(-13).map((item) => item.totalBalance);
  const now = values.at(-1) ?? 0;
  const lastMonth = values.at(-2) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Net worth</CardTitle>
        <Link
          href="/dashboard/net-worth"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          Details
        </Link>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div>
          <Metric>{formatCurrency(now, mainCurrency)}</Metric>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {formatCurrency(now - lastMonth, mainCurrency, { signDisplay: 'exceptZero' })}
            <PriceChangeBadge percent={lastMonth ? (now - lastMonth) / Math.abs(lastMonth) : 0} />
            this month
          </div>
        </div>
        <TrendLine values={values} color="var(--chart-1)" className="h-12 w-32 sm:w-48" />
      </CardContent>
    </Card>
  );
}
