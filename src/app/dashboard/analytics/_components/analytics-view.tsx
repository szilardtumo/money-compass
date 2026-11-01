'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CategoryAvatar, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { PeriodPicker } from '@/components/period-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DonutChart } from '@/components/ui/chart';
import { Metric } from '@/components/ui/metric';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { Sparkline } from '@/components/ui/sparkline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { Analytics, AnalyticsTotal } from '@/lib/types/analytics.types';
import { Category } from '@/lib/types/categories.types';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { formatPeriodLabel, parsePeriod, shiftPeriod } from '@/lib/utils/periods';

import { AnalyticsParams, getAnalyticsHref } from './analytics-params';

const getChange = ({ amount, previousAmount }: { amount: number; previousAmount: number }) =>
  previousAmount ? (amount - previousAmount) / Math.abs(previousAmount) : 0;

interface AnalyticsViewProps {
  analytics: Analytics;
  /** For the account filter */
  accounts: Account[];
  params: AnalyticsParams;
}

export function AnalyticsView({ analytics, accounts, params }: AnalyticsViewProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const period = parsePeriod(params.period);
  const { mainCurrency, totals } = analytics;
  const format = (value: number) => formatCurrency(value, mainCurrency);
  const href = (changes: Partial<AnalyticsParams>) =>
    getAnalyticsHref({ ...params, excluded: false, ...changes });
  const subaccountOptions = accounts.flatMap((account) =>
    account.subaccounts.map((subaccount) => ({
      label: subaccount.name,
      value: subaccount.id,
      group: account.name,
    })),
  );

  const categories = analytics.categories[params.view];
  const uncategorized = categories.find((item) => !item.category)?.amount ?? 0;
  const categorizedShare = totals[params.view].amount
    ? 1 - uncategorized / totals[params.view].amount
    : 1;
  const sideLabel = params.view === 'spending' ? 'Spent' : 'Income';
  const now = parsePeriod(undefined);
  // This year's months so far, the current one included
  const monthCount = !params.period ? 12 : period.year < now.year ? 12 : now.month + 1;
  const getCaption = (total: { amount: number; previousAmount: number }) =>
    period.unit === 'month' && params.period
      ? `${format(total.previousAmount)} in ${formatPeriodLabel(shiftPeriod(period, -1))}`
      : `${format(total.amount / monthCount)} a month`;
  const net = totals.income.amount - totals.spending.amount;
  const savingsRate = totals.income.amount > 0 ? net / totals.income.amount : null;
  const formatShare = (value: number) =>
    formatPercent(Math.abs(value), { maximumFractionDigits: 0, minimumFractionDigits: 0 });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <PeriodPicker period={params.period} withLastMonths />
        {subaccountOptions.length > 1 && (
          <MultiSelectFilter
            title="Account"
            options={subaccountOptions}
            selected={params.subaccountIds ?? []}
            onSelectedChange={(subaccountIds) =>
              router.push(href({ subaccountIds }), { scroll: false })
            }
          />
        )}
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
            ['Spent', totals.spending, true, analytics.chart.map((item) => item.spending)],
            ['Income', totals.income, false, analytics.chart.map((item) => item.income)],
            [
              'Net',
              {
                amount: net,
                previousAmount: totals.income.previousAmount - totals.spending.previousAmount,
              },
              false,
              analytics.chart.map((item) => item.income - item.spending),
            ],
          ] as const
        ).map(([label, total, invert, values]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Metric>{format(total.amount)}</Metric>
                  <PriceChangeBadge percent={getChange(total)} invert={invert} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {getCaption(total)}
                  {label === 'Net' &&
                    savingsRate !== null &&
                    (savingsRate >= 0
                      ? ` · kept ${formatShare(savingsRate)} of income`
                      : ` · ${formatShare(savingsRate)} over income`)}
                </p>
              </div>
              <Sparkline
                values={values}
                color={label === 'Spent' ? 'var(--chart-1)' : 'var(--chart-2)'}
                negativeColor={label === 'Net' ? 'var(--destructive)' : undefined}
                width={240}
                height={48}
                className="h-12 w-full"
                highlight={
                  params.period
                    ? analytics.chart.findIndex((item) => item.period === params.period)
                    : undefined
                }
                tooltips={analytics.chart.map(
                  (item, index) =>
                    `${formatPeriodLabel(parsePeriod(item.period))}: ${format(values[index])}`,
                )}
                onBarClick={(index) =>
                  router.push(href({ period: analytics.chart[index].period }), { scroll: false })
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {categorizedShare < 1 && (
        <p className="text-sm text-muted-foreground">
          {formatPercent(categorizedShare, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}{' '}
          of this {params.view} is categorized.{' '}
          <Link
            href={getDrawerHref({ category: 'uncategorized', period: params.period })}
            scroll={false}
            className="font-medium underline"
          >
            Review uncategorized
          </Link>
        </p>
      )}

      <Card>
        <Tabs defaultValue="categories">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {sideLabel} in {params.period ? formatPeriodLabel(period) : 'the last 12 months'}
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
                  href: getDrawerHref({
                    category: item.category?.id ?? 'uncategorized',
                    period: params.period,
                  }),
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
                  detail: item.category?.name ?? 'Uncategorized',
                  href: getDrawerHref({ merchant: item.merchant.id, period: params.period }),
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
    /** Shown before the transaction count, like the merchant's category */
    detail?: string;
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
    <ul className="flex flex-1 flex-col">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            scroll={false}
            prefetch={false}
            className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
          >
            <CategoryAvatar category={item.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  item.detail,
                  `${item.transactionCount} transaction${item.transactionCount === 1 ? '' : 's'}`,
                  total > 0 &&
                    formatPercent(item.amount / total, {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-medium whitespace-nowrap">{format(item.amount)}</span>
              {item.previousAmount !== 0 && (
                <PriceChangeBadge variant="secondary" percent={getChange(item)} invert={invert} />
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
