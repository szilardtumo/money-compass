'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils/formatters';
import { formatPeriodLabel, parsePeriod } from '@/lib/utils/periods';

interface NetWorthChangesCardClientProps {
  /** Like "2026-10", the oldest first */
  months: { month: string; saved: number; other: number }[];
  mainCurrency: string;
  className?: string;
}

export function NetWorthChangesCardClient({
  months,
  mainCurrency,
  className,
}: NetWorthChangesCardClientProps) {
  const format = (value: number) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
  const saved = months.reduce((total, item) => total + item.saved, 0);
  const other = months.reduce((total, item) => total + item.other, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Where the change came from</CardTitle>
        <CardDescription>
          {format(saved + other)} in the last 12 months: {format(saved)} saved from income and
          spending, {format(other)} from transfers, investments, balance updates and other
          transactions excluded from analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BarChart
          className="h-56"
          data={months.map((item) => ({
            label: formatPeriodLabel(parsePeriod(item.month), 'short'),
            Saved: item.saved,
            Other: item.other,
          }))}
          index="label"
          categories={['Saved', 'Other']}
          colors={['var(--chart-2)', 'var(--chart-3)']}
          type="stacked"
          valueFormatter={(value) => format(value as number)}
          yAxisWidth={72}
          showGridLines={false}
        />
      </CardContent>
    </Card>
  );
}
