'use client';

import { AreaChart } from '@tremor/react';

import { Metric } from '@/components/ui/metric';
import { cn } from '@/lib/cn';
import { mainCurrency } from '@/lib/constants';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface TransactionHistoryChartProps {
  data: TransactionHistory[];
}

export function TransactionHistoryChart({ data }: TransactionHistoryChartProps) {
  const lastValue = data[data.length - 1]?.balances.total ?? 0;
  const previousLastValue = data[data.length - 2]?.balances.total;
  const difference = lastValue - previousLastValue;

  return (
    <div>
      <Metric>{formatCurrency(lastValue, mainCurrency)}</Metric>
      {Number.isFinite(difference) && (
        <p className={cn('text-sm', difference >= 0 ? 'text-success' : 'text-destructive')}>
          {difference >= 0 && '+'}
          {formatCurrency(difference, mainCurrency)} (
          {formatPercent(difference / previousLastValue)})
        </p>
      )}
      <AreaChart
        data={data}
        index="date"
        categories={['balances.total']}
        curveType="monotone"
        yAxisWidth={55}
        showLegend={false}
        showGridLines={false}
        startEndOnly
        showAnimation
        className="mt-6 h-48"
        valueFormatter={(value) =>
          formatCurrency(value, mainCurrency, { maximumFractionDigits: 0 })
        }
      />
    </div>
  );
}
