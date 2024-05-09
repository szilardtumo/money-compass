'use client';

import { BarChart, CustomTooltipProps } from '@tremor/react';
import { useMemo } from 'react';

import {
  ChartTooltip,
  ChartTooltipContent,
  ChartTooltipHeader,
  ChartTooltipRow,
  ChartTooltipTitle,
} from '@/components/ui/chart-tooltip';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface NetWorthDifferenceChartProps {
  data: TransactionHistory[];
}

function CustomTooltip({ payload, label }: CustomTooltipProps) {
  const displayedItem = payload?.find((item) => item.value) ?? payload?.[0];

  return (
    <ChartTooltip>
      <ChartTooltipHeader>
        <ChartTooltipTitle>{label}</ChartTooltipTitle>
      </ChartTooltipHeader>
      <ChartTooltipContent>
        {!!displayedItem && (
          <ChartTooltipRow
            color={displayedItem.color}
            name={String(displayedItem.name)}
            value={formatCurrency(Number(displayedItem.value), displayedItem.payload.Currency, {
              signDisplay: 'always',
            })}
            delta={displayedItem.payload.Delta}
          />
        )}
      </ChartTooltipContent>
    </ChartTooltip>
  );
}

export function NetWorthDifferenceChart({ data }: NetWorthDifferenceChartProps) {
  const currency = data[0]?.mainCurrency ?? 'eur';

  const parsedData = useMemo(() => {
    const parsedTransactionHistory = data
      .map((item) => ({
        Date: formatDate(item.date), // TODO: should be date range
        Currency: item.mainCurrency,
        Total: Object.values(item.accountBalances).reduce(
          (acc, balance) => acc + balance.mainCurrencyValue,
          0,
        ),
      }))
      .map((item, i, array) => ({
        ...item,
        Profit: i === 0 ? 0 : Math.max(item.Total - array[i - 1].Total, 0),
        Loss: i === 0 ? 0 : Math.min(item.Total - array[i - 1].Total, 0),
        Delta: i === 0 ? 0 : (item.Total - array[i - 1].Total) / array[i - 1].Total,
      }))
      .slice(1);

    return parsedTransactionHistory;
  }, [data]);

  const isSm = useBreakpoint('sm');

  return (
    <div>
      <BarChart
        data={parsedData}
        index="Date"
        categories={['Profit', 'Loss']}
        colors={['green', 'red']}
        showYAxis={isSm}
        yAxisWidth={75}
        showXAxis={false}
        showLegend={false}
        customTooltip={CustomTooltip}
        stack
        showAnimation
        className=""
        valueFormatter={(value) => formatCurrency(value, currency)}
      />
    </div>
  );
}
