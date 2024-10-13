'use client';

import { useMemo } from 'react';

import { ChartTooltipContent, BarChart } from '@/components/ui/chart';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface NetWorthDifferenceChartProps {
  data: TransactionHistory[];
}

export function NetWorthDifferenceChart({ data }: NetWorthDifferenceChartProps) {
  const currency = data[0]?.mainCurrency ?? 'eur';

  const parsedData = useMemo(() => {
    const parsedTransactionHistory = data
      .map((item) => ({
        Date: item.date,
        Month: formatDate(item.date, 'MMM'),
        Currency: item.mainCurrency,
        Total: Object.values(item.accountBalances).reduce(
          (acc, balance) => acc + balance.totalBalance,
          0,
        ),
      }))
      .map((item, i, array) => ({
        ...item,
        Profit: i === 0 ? 0 : Math.max(item.Total - array[i - 1].Total, 0),
        Loss: i === 0 ? 0 : Math.min(item.Total - array[i - 1].Total, 0),
        Difference: i === 0 ? 0 : item.Total - array[i - 1].Total,
        Delta: i === 0 ? 0 : (item.Total - array[i - 1].Total) / array[i - 1].Total,
        fill: item.Total >= array[i - 1]?.Total ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
      }))
      .slice(1);

    return parsedTransactionHistory;
  }, [data]);

  return (
    <div>
      <BarChart
        className="h-64"
        data={parsedData}
        index="Month"
        categories={['Difference']}
        showYAxis={false}
        showLegend={false}
        valueFormatter={(value) => formatCurrency(value as number, currency)}
        customTooltipContent={(props) => (
          <ChartTooltipContent
            {...props}
            labelFormatter={(_, payload) => formatDate(payload[0]?.payload.Date, 'MMMM yyyy')}
          />
        )}
      />
    </div>
  );
}
