'use client';

import { cn } from 'cn';
import { ComponentProps } from 'react';

import {
  getRangeLabel,
  sliceHistory,
  useHistoryRange,
} from '@/components/cards/net-worth-history-card/use-history-range';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils/formatters';
import { formatPeriodLabel, parsePeriod } from '@/lib/utils/periods';

interface NetWorthChangesCardClientProps {
  /** Every month of the history, like "2026-10", the oldest first */
  months: { month: string; saved: number; other: number }[];
  /** Of the first month of the history */
  firstDate: Date;
  mainCurrency: string;
  className?: string;
}

const getColor = (value: number) =>
  value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : undefined;

export function NetWorthChangesCardClient({
  months: allMonths,
  firstDate,
  mainCurrency,
  className,
}: NetWorthChangesCardClientProps) {
  const [range] = useHistoryRange();
  // Like the history card, which compares the range's last balance with the one before the range
  const months = sliceHistory(allMonths, range).slice(1);
  const format = (value: number) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
  const saved = months.reduce((total, item) => total + item.saved, 0);
  const other = months.reduce((total, item) => total + item.other, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Where the change came from</CardTitle>
        <CardDescription>
          The change {getRangeLabel(range, firstDate)}. Saved is income minus spending. Transfers
          and adjustments are the transactions excluded from analytics, like investments, currency
          exchanges and balance corrections.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl className="grid grid-cols-3 gap-4">
          {(
            [
              ['Net worth change', saved + other],
              ['Saved', saved],
              ['Transfers and adjustments', other],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className={cn('text-lg font-semibold', getColor(value))}>{format(value)}</dd>
            </div>
          ))}
        </dl>
        <BarChart
          className="h-56"
          data={months.map((item) => {
            const change = item.saved + item.other;
            return {
              label: formatPeriodLabel(parsePeriod(item.month), 'short'),
              Increase: change > 0 ? change : null,
              Decrease: change < 0 ? change : null,
              lines: [
                ['Saved', format(item.saved)],
                ['Transfers and adjustments', format(item.other)],
                ['Net worth change', format(change)],
              ],
            };
          })}
          index="label"
          categories={['Increase', 'Decrease']}
          colors={['var(--success)', 'var(--destructive)']}
          type="stacked"
          valueFormatter={(value) => format(value as number)}
          yAxisWidth={72}
          showGridLines={false}
          showLegend={false}
          customTooltipContent={ChangeTooltip}
        />
      </CardContent>
    </Card>
  );
}

function ChangeTooltip({ active, payload, label }: ComponentProps<typeof ChartTooltipContent>) {
  const lines: [string, string][] | undefined = payload?.[0]?.payload.lines;
  if (!active || !lines) {
    return null;
  }

  return (
    <div className="grid min-w-48 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <p className="font-medium">{label}</p>
      {lines.map(([name, value], index) => (
        <div
          key={name}
          className={cn('flex justify-between gap-3', index === lines.length - 1 && 'font-medium')}
        >
          <span className={index < lines.length - 1 ? 'text-muted-foreground' : undefined}>
            {name}
          </span>
          <span className="font-mono tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}
