'use client';

import { AreaChart } from '@tremor/react';

import { mainCurrency } from '@/lib/constants';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

import { Card, CardContent, CardDescription, CardHeader, CardMetric, CardTitle } from '../ui/card';

interface NetWorthChartProps {
  data: TransactionHistory[];
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  const netWorth = data[data.length - 1]?.balances.total ?? 0;
  const previousNetWorth = data[data.length - 2]?.balances.total;
  const difference = netWorth - previousNetWorth;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <CardMetric>{formatCurrency(netWorth, mainCurrency)}</CardMetric>
        {Number.isFinite(difference) && (
          <CardDescription>
            <span className={difference >= 0 ? 'text-success' : 'text-destructive'}>
              {difference >= 0 && '+'}
              {formatCurrency(difference, mainCurrency)} (
              {formatPercent(difference / previousNetWorth)})
            </span>
          </CardDescription>
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
      </CardContent>
    </Card>
  );
}
