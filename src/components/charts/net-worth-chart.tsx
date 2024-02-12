'use client';

import { AreaChart } from '@tremor/react';

import { mainCurrency } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils/formatters';

import { Card, CardContent, CardDescription, CardHeader, CardMetric, CardTitle } from '../ui/card';

const data = [
  {
    date: 'August 2023',
    'Net Worth': 2100.2,
  },
  {
    date: 'September 2023',
    'Net Worth': 2943.0,
  },
  {
    date: 'October 2023',
    'Net Worth': 4889.5,
  },
  {
    date: 'December 2023',
    'Net Worth': 3909.8,
  },
  {
    date: 'January 2024',
    'Net Worth': 5778.7,
  },
  {
    date: 'February 2024',
    'Net Worth': 5900.9,
  },
  {
    date: 'March 2024',
    'Net Worth': 4129.4,
  },
];

interface NetWorthChartProps {
  netWorth: number;
}

export function NetWorthChart({ netWorth }: NetWorthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <CardMetric>{formatCurrency(netWorth, mainCurrency)}</CardMetric>
        <CardDescription>
          <span className="text-emerald-700 dark:text-emerald-500">+$430.90 (4.1%)</span>{' '}
          <span className="font-normal">Past 24 hours</span>
        </CardDescription>
        <AreaChart
          data={data}
          index="date"
          categories={['Net Worth']}
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
