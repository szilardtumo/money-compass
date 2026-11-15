'use client';

import { format, parseISO, startOfYear, subMonths, subYears } from 'date-fns';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatCurrency } from '@/lib/utils/formatters';
import { PortfolioHistoryPoint } from '@/server/api/investments/overview';

const RANGES = ['1M', '3M', 'YTD', '1Y', 'All'] as const;
type Range = (typeof RANGES)[number];

interface PortfolioHistoryCardClientProps {
  /** Daily, from the first transaction to today */
  history: PortfolioHistoryPoint[];
  mainCurrency: string;
}

export function PortfolioHistoryCardClient({
  history,
  mainCurrency,
}: PortfolioHistoryCardClientProps) {
  const [range, setRange] = useState<Range>('1Y');
  const isSm = useBreakpoint('sm');
  const last = parseISO(history.at(-1)!.date);
  const start = {
    '1M': subMonths(last, 1),
    '3M': subMonths(last, 3),
    YTD: startOfYear(last),
    '1Y': subYears(last, 1),
    All: undefined,
  }[range];
  const from = start && format(start, 'yyyy-MM-dd');
  const data = history
    .filter((point) => !from || point.date >= from)
    .map((point) => ({
      Date: format(parseISO(point.date), 'd MMM yyyy'),
      Value: point.value,
      'Net invested': point.netInvested,
    }));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <CardTitle>Value and net invested</CardTitle>
        <Tabs value={range} onValueChange={(value) => setRange(value as Range)}>
          <TabsList>
            {RANGES.map((item) => (
              <TabsTrigger key={item} value={item}>
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <AreaChart
          data={data}
          index="Date"
          categories={['Value', 'Net invested']}
          fill="gradient"
          startEndOnly
          showYAxis={isSm}
          yAxisWidth={80}
          className="h-64"
          valueFormatter={(value) =>
            formatCurrency(value as number, mainCurrency, { maximumFractionDigits: 0 })
          }
        />
      </CardContent>
    </Card>
  );
}
