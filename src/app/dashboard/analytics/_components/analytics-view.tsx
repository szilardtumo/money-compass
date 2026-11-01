'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CategoryAvatar, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { PeriodPicker } from '@/components/period-picker';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, DonutChart } from '@/components/ui/chart';
import { Metric } from '@/components/ui/metric';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { Sparkline } from '@/components/ui/sparkline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { Analytics, AnalyticsSide, AnalyticsTotal } from '@/lib/types/analytics.types';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
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
  /** For the account filter */
  accounts: Account[];
  /** Of the period that count in analytics, the latest 50 unless params.allTransactions */
  transactions: Transaction[];
  /** For changing the transactions' categories */
  categories: Category[];
  params: AnalyticsParams;
}

export function AnalyticsView({
  analytics,
  accounts,
  transactions,
  categories: allCategories,
  params,
}: AnalyticsViewProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const period = parsePeriod(params.period);
  const { mainCurrency, totals } = analytics;
  const format = (value: number) => formatCurrency(value, mainCurrency);
  const href = (changes: Partial<AnalyticsParams>) => getAnalyticsHref({ ...params, ...changes });
  const subaccountOptions = accounts.flatMap((account) =>
    account.subaccounts.map((subaccount) => ({
      label: subaccount.name,
      value: subaccount.id,
      group: account.name,
    })),
  );

  const [view, setView] = useState<AnalyticsSide>('spending');
  const categories = analytics.categories[view];
  const transactionCount = [
    ...analytics.categories.spending,
    ...analytics.categories.income,
  ].reduce((total, item) => total + item.transactionCount, 0);
  const sideLabel = view === 'spending' ? 'Spent' : 'Income';
  const now = parsePeriod(undefined);
  // This year's months so far, the current one included
  const monthCount = period.year < now.year ? 12 : now.month + 1;
  const getCaption = (total: { amount: number; previousAmount: number }) =>
    period.unit === 'month'
      ? `${format(total.previousAmount)} in ${formatPeriodLabel(shiftPeriod(period, -1))}`
      : `${format(total.amount / monthCount)} a month`;
  const net = totals.income.amount - totals.spending.amount;
  const savingsRate = totals.income.amount > 0 ? net / totals.income.amount : null;
  const formatShare = (value: number) =>
    formatPercent(Math.abs(value), { maximumFractionDigits: 0 });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <PeriodPicker period={params.period} />
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
                highlight={analytics.chart.findIndex((item) => item.period === params.period)}
                tooltips={analytics.chart.map(
                  (item, index) =>
                    `${formatPeriodLabel(parsePeriod(item.period))}: ${format(values[index])}`,
                )}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {analytics.pace && <PaceCard pace={analytics.pace} format={format} />}

      <Card>
        <Tabs defaultValue="categories">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="mr-auto">
              {sideLabel} in {formatPeriodLabel(period)}
            </CardTitle>
            <Tabs value={view} onValueChange={(value) => setView(value as AnalyticsSide)}>
              <TabsList>
                <TabsTrigger value="spending">Spending</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>
            </Tabs>
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
                label={format(totals[view].amount)}
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
                total={totals[view].amount}
                format={format}
                invert={view === 'spending'}
              />
            </TabsContent>
            <TabsContent value="merchants">
              <TotalsList
                items={analytics.merchants[view].map((item) => ({
                  ...item,
                  key: item.merchant.id,
                  name: item.merchant.name,
                  detail: item.category?.name ?? 'Uncategorized',
                  href: getDrawerHref({ merchant: item.merchant.id, period: params.period }),
                }))}
                total={totals[view].amount}
                format={format}
                invert={view === 'spending'}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions in {formatPeriodLabel(period)}</CardTitle>
          <CardDescription>
            {transactions.length < transactionCount
              ? `The latest ${transactions.length} of ${transactionCount}`
              : `${transactionCount} transaction${transactionCount === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <TransactionDayList
            transactions={transactions}
            accounts={accounts}
            categories={allCategories}
          />
          {transactions.length < transactionCount && (
            <Button variant="outline" asChild>
              <Link href={href({ allTransactions: true })} scroll={false}>
                Show all {transactionCount}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/**
 * The running total of a month's spending against the month before, day by day.
 */
function PaceCard({
  pace,
  format,
}: {
  pace: NonNullable<Analytics['pace']>;
  format: (value: number) => string;
}) {
  const month = parsePeriod(pace.month);
  const label = formatPeriodLabel(month);
  const previousLabel = formatPeriodLabel(shiftPeriod(month, -1));
  const isCurrent = pace.month === formatPeriodParam(parsePeriod(undefined));
  const lastDay = pace.days.findLastIndex((value) => value !== null);
  const spent = pace.days[lastDay] ?? 0;
  // This month against the same day of the last one, a past month against the whole one before
  const difference =
    spent -
    ((isCurrent
      ? pace.previousDays[Math.min(lastDay, pace.previousDays.length - 1)]
      : pace.previousDays.at(-1)) ?? 0);
  const comparison = `${format(Math.abs(difference))} ${difference > 0 ? 'more' : 'less'}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending pace</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isCurrent
            ? `${format(spent)} so far, ${comparison} than at this point in ${previousLabel}`
            : `${format(spent)} in ${label}, ${comparison} than in ${previousLabel}`}
        </p>
      </CardHeader>
      <CardContent>
        <AreaChart
          className="h-48"
          data={Array.from(
            { length: Math.max(pace.days.length, pace.previousDays.length) },
            (_, index) => ({
              day: String(index + 1),
              [previousLabel]: pace.previousDays[index] ?? null,
              [label]: pace.days[index] ?? null,
            }),
          )}
          index="day"
          categories={[previousLabel, label]}
          colors={['var(--muted-foreground)', 'var(--chart-1)']}
          curveType="monotone"
          showYAxis={false}
          showGridLines={false}
          valueFormatter={(value) => format(value as number)}
        />
      </CardContent>
    </Card>
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
                  total > 0 && formatPercent(item.amount / total, { maximumFractionDigits: 0 }),
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
