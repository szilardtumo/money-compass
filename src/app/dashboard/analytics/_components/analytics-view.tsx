'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CategoryIcon, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DonutChart } from '@/components/ui/chart';
import { Metric } from '@/components/ui/metric';
import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Analytics, AnalyticsTotal } from '@/lib/types/analytics.types';
import { Category } from '@/lib/types/categories.types';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import {
  formatPeriodLabel,
  formatPeriodParam,
  parsePeriod,
  shiftPeriod,
} from '@/lib/utils/periods';

import { AnalyticsParams, getAnalyticsHref } from './analytics-params';

const getChange = ({ amount, previousAmount }: { amount: number; previousAmount: number }) =>
  previousAmount ? (amount - previousAmount) / Math.abs(previousAmount) : 0;

interface AnalyticsViewProps {
  analytics: Analytics;
  params: AnalyticsParams;
  /** Like "2026-10" */
  currentMonth: string;
}

export function AnalyticsView({ analytics, params, currentMonth }: AnalyticsViewProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const period = parsePeriod(params.period);
  const { mainCurrency, totals } = analytics;
  const format = (value: number) => formatCurrency(value, mainCurrency);
  const href = (changes: Partial<AnalyticsParams>) =>
    getAnalyticsHref({ period: params.period, view: params.view, ...changes });

  const categories = analytics.categories[params.view];
  const uncategorized = categories.find((item) => !item.category)?.amount ?? 0;
  const categorizedShare = totals[params.view].amount
    ? 1 - uncategorized / totals[params.view].amount
    : 1;
  const sideLabel = params.view === 'spending' ? 'Spent' : 'Income';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={href({ period: formatPeriodParam(shiftPeriod(period, -1)) })}
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
          aria-label="Previous period"
        >
          <ChevronLeftIcon className="size-4" />
        </Link>
        <span className="min-w-36 text-center font-semibold">{formatPeriodLabel(period)}</span>
        <Link
          href={href({ period: formatPeriodParam(shiftPeriod(period, 1)) })}
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
          aria-label="Next period"
        >
          <ChevronRightIcon className="size-4" />
        </Link>
        <LinkTabs
          tabs={[
            {
              label: 'Month',
              // The current month of this year, or the last month of a past year
              href: href({
                period: currentMonth.startsWith(String(period.year))
                  ? currentMonth
                  : formatPeriodParam({ unit: 'month', year: period.year, month: 11 }),
              }),
              active: period.unit === 'month',
            },
            {
              label: 'Year',
              href: href({ period: String(period.year) }),
              active: period.unit === 'year',
            },
          ]}
        />
        <LinkTabs
          className="sm:ml-auto"
          tabs={(['spending', 'income'] as const).map((view) => ({
            label: view === 'spending' ? 'Spending' : 'Income',
            href: href({ view }),
            active: params.view === view,
          }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ['Spent', totals.spending, true],
            ['Income', totals.income, false],
            [
              'Net',
              {
                amount: totals.income.amount - totals.spending.amount,
                previousAmount: totals.income.previousAmount - totals.spending.previousAmount,
              },
              false,
            ],
          ] as const
        ).map(([label, total, invert]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Metric>{format(total.amount)}</Metric>
              <PriceChangeBadge percent={getChange(total)} invert={invert} />
            </CardContent>
          </Card>
        ))}
      </div>

      {categorizedShare < 1 && (
        <p className="text-sm text-muted-foreground">
          {formatPercent(categorizedShare, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}{' '}
          of this {params.view} is categorized.{' '}
          <Link href="/dashboard/merchants" className="font-medium underline">
            Review merchants
          </Link>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {sideLabel} by {period.unit}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            className="h-56"
            data={analytics.chart}
            index="label"
            categories={[params.view]}
            valueFormatter={(value) => format(value as number)}
            showLegend={false}
            onValueChange={(value) => {
              if (value?.payload) {
                router.push(href({ period: value.payload.period }), { scroll: false });
              }
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <Tabs defaultValue="categories">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {sideLabel} in {formatPeriodLabel(period)}
            </CardTitle>
            <TabsList>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="merchants">Merchants</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="categories" className="flex flex-col gap-6 md:flex-row">
              <DonutChart
                className="mx-auto h-48 w-48 shrink-0"
                data={categories
                  // A slice can't be negative, when refunds outweigh the spending
                  .filter((item) => item.amount > 0)
                  .map((item) => ({
                    name: item.category?.name ?? 'Uncategorized',
                    amount: item.amount,
                    fill: item.category?.color ?? UNCATEGORIZED_COLOR,
                  }))}
                index="amount"
                categories={['name']}
                showLabel
                label={format(totals[params.view].amount)}
                valueFormatter={(value) => format(value as number)}
              />
              <TotalsList
                items={categories.map((item) => ({
                  ...item,
                  key: item.category?.id ?? 'uncategorized',
                  name: item.category?.name ?? 'Uncategorized',
                  href: getDrawerHref({ category: item.category?.id ?? 'uncategorized' }),
                }))}
                total={totals[params.view].amount}
                format={format}
                invert={params.view === 'spending'}
              />
            </TabsContent>
            <TabsContent value="merchants">
              <TotalsList
                items={analytics.merchants[params.view].map((item) => ({
                  ...item,
                  key: item.merchant.id,
                  name: item.merchant.name,
                  href: getDrawerHref({ merchant: item.merchant.id }),
                }))}
                total={totals[params.view].amount}
                format={format}
                invert={params.view === 'spending'}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {analytics.excludedCount > 0 && (
        <Link
          href={href({ excluded: true })}
          scroll={false}
          className="text-sm text-muted-foreground underline"
        >
          {analytics.excludedCount} transactions excluded from analytics
        </Link>
      )}
    </>
  );
}

function LinkTabs({
  tabs,
  className,
}: {
  tabs: { label: string; href: string; active: boolean }[];
  className?: string;
}) {
  return (
    <Tabs value={tabs.find((tab) => tab.active)?.label} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.label} value={tab.label} asChild>
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function TotalsList({
  items,
  total,
  format,
  invert,
}: {
  items: (AnalyticsTotal & {
    key: string;
    name: string;
    href: string;
    category: Category | null;
  })[];
  total: number;
  format: (value: number) => string;
  invert: boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No transactions in this period.</p>;
  }

  return (
    <ul className="flex flex-1 flex-col divide-y">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            scroll={false}
            prefetch={false}
            className="flex items-center gap-3 py-2 hover:bg-muted/50"
          >
            {item.category ? (
              <CategoryIcon category={item.category} />
            ) : (
              <span className="size-4 shrink-0 rounded-full border border-dashed" />
            )}
            <span className="mr-auto truncate font-medium">{item.name}</span>
            <span className="text-sm text-muted-foreground">
              {total > 0 &&
                formatPercent(item.amount / total, {
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                })}
            </span>
            {item.previousAmount !== 0 && (
              <PriceChangeBadge variant="secondary" percent={getChange(item)} invert={invert} />
            )}
            <span className="w-28 text-right font-medium whitespace-nowrap">
              {format(item.amount)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
