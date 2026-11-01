'use client';

import { NumberFlowGroup } from '@number-flow/react';
import { useMemo } from 'react';

import { AreaChart } from '@/components/ui/chart';
import { Currency } from '@/components/ui/currency';
import { Metric } from '@/components/ui/metric';
import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface TransactionHistoryChartProps {
  data: TransactionHistory[];
  accounts: Account[];
  /** If there are multiple accounts, it stacks accounts, if there is only one account, it stacks its subaccounts */
  stack?: boolean;
  /** Shows the change since the first point with this label, like "this year", else since the one before */
  changeLabel?: string;
}

export function TransactionHistoryChart({
  data,
  accounts,
  stack = false,
  changeLabel,
}: TransactionHistoryChartProps) {
  const currency = data[0]?.mainCurrency ?? 'eur';

  const parsedData = useMemo(() => {
    const parsedTransactionHistory = data.map(
      (item) =>
        ({
          Date: item.date,
          Month: formatDate(item.date, 'MMMM yyyy'),
          // Generate an entry for the total value
          Total: Object.values(item.accountBalances).reduce(
            (acc, item) => acc + item.totalBalance,
            0,
          ),
          // Generate an entry for every account and subaccount
          ...Object.fromEntries(
            accounts.flatMap((account) => [
              [account.name, item.accountBalances[account.id].totalBalance] as const,
              ...account.subaccounts.map(
                (subaccount) =>
                  [
                    subaccount.name,
                    item.accountBalances[account.id].subaccountBalances[subaccount.id]
                      .mainCurrencyValue,
                  ] as const,
              ),
            ]),
          ),
        }) as {
          Date: Date;
          Month: string;
          Total: number;
          [key: string]: Date | string | number;
        },
    );

    // If there is only one data point, duplicate it so that the chart renders a horizontal line
    if (parsedTransactionHistory.length === 1) {
      return [parsedTransactionHistory[0], { ...parsedTransactionHistory[0], Month: 'Now' }];
    }
    return parsedTransactionHistory;
  }, [accounts, data]);

  const chartCategories = useMemo(() => {
    if (accounts.length === 1) {
      if (stack) {
        return accounts[0].subaccounts.map((subaccount) => subaccount.name);
      } else {
        return [accounts[0].name];
      }
    }

    if (stack) {
      return accounts.map((account) => account.name);
    } else {
      return ['Total'];
    }
  }, [accounts, stack]);

  const metric = useMemo(() => {
    const value = parsedData[parsedData.length - 1]
      ? chartCategories.reduce(
          // @ts-expect-error - TS doesn't know that parsedData[parsedData.length - 1] contains all the categories
          (acc, category) => acc + parsedData[parsedData.length - 1][category],
          0,
        )
      : 0;
    const previous = parsedData[changeLabel ? 0 : parsedData.length - 2];
    const prevValue = previous
      ? chartCategories.reduce(
          // @ts-expect-error - TS doesn't know that previous contains all the categories
          (acc, category) => acc + previous[category],
          0,
        )
      : 0;

    return {
      value,
      prevValue,
      difference: value - prevValue,
      change: (value - prevValue) / prevValue || 0,
    };
  }, [parsedData, chartCategories, changeLabel]);

  const minValue = useMemo(() => {
    const min = parsedData.length
      ? parsedData.reduce((acc, item) => Math.min(acc, item.Total), Infinity)
      : 0;

    // The chart minimum value is 25% lower than the minimum value
    return min * 0.75;
  }, [parsedData]);

  const isSm = useBreakpoint('sm');

  return (
    <div>
      <NumberFlowGroup>
        <Metric>
          <Currency value={metric.value} currency={currency} />
        </Metric>
        <div className="flex gap-2 items-center">
          <Currency
            className="text-sm text-muted-foreground"
            value={metric.difference}
            currency={currency}
            formatOptions={{ signDisplay: 'always' }}
          />
          <PriceChangeBadge variant="default" percent={metric.change} />
          {changeLabel && <span className="text-sm text-muted-foreground">{changeLabel}</span>}
        </div>
      </NumberFlowGroup>

      <AreaChart
        data={parsedData}
        index="Month"
        categories={chartCategories}
        type={stack ? 'stacked' : 'default'}
        fill={chartCategories.length <= 1 ? 'gradient' : 'solid'}
        curveType="monotone"
        yAxisWidth={75}
        showYAxis={isSm}
        showXAxis={false}
        showLegend={false}
        showGridLines={false}
        minValue={minValue}
        connectNulls
        className="mt-6 h-48"
        valueFormatter={(value) => formatCurrency(value as number, currency)}
      />
    </div>
  );
}
