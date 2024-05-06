'use client';

import { AreaChart } from '@tremor/react';
import { useMemo } from 'react';

import { Metric } from '@/components/ui/metric';
import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface TransactionHistoryChartProps {
  data: TransactionHistory[];
  accounts: SimpleAccount[];
  subaccountIdsToShow?: string[]; // If not provided, the total net worth will be shown, otherwise a detailed view of the selected subaccounts
}

export function TransactionHistoryChart({
  data,
  accounts,
  subaccountIdsToShow,
}: TransactionHistoryChartProps) {
  // helper map to access accounts by subaccountId in O(1)
  const accountMap = useMemo(() => {
    return accounts.reduce<Record<string, SimpleAccount>>((acc, account) => {
      acc[account.subaccountId] = account;
      return acc;
    }, {});
  }, [accounts]);

  // Account currency is used if there is only one account to show, otherwise the main currency is used
  const useMainCurrency = !subaccountIdsToShow || subaccountIdsToShow.length > 1;
  const currency = useMainCurrency
    ? data[0]?.mainCurrency ?? 'eur'
    : accountMap[subaccountIdsToShow[0]].currency;

  const parsedData = useMemo(() => {
    const parsedTransactionHistory = data.map((item) => ({
      Date: formatDate(item.date), // TODO: should be date range
      // Generate an entry for the total value
      Total: Object.values(item.accountBalances).reduce(
        (acc, balance) =>
          acc + (useMainCurrency ? balance.mainCurrencyValue : balance.originalValue),
        0,
      ),
      // Generate an entry for every subaccount
      ...Object.fromEntries(
        accounts.map((account) => [
          account.name,
          useMainCurrency
            ? item.accountBalances[account.subaccountId].mainCurrencyValue
            : item.accountBalances[account.subaccountId].originalValue,
        ]),
      ),
    }));

    // If there is only one data point, duplicate it so that the chart renders a horizontal line
    if (parsedTransactionHistory.length === 1) {
      return [parsedTransactionHistory[0], { ...parsedTransactionHistory[0], Date: 'Now' }];
    }
    return parsedTransactionHistory;
  }, [accounts, data, useMainCurrency]);

  const chartCategories = useMemo(() => {
    return subaccountIdsToShow?.map((subaccountId) => accountMap[subaccountId].name) ?? ['Total'];
  }, [accountMap, subaccountIdsToShow]);

  const metric = useMemo(() => {
    const value = parsedData[parsedData.length - 1]
      ? chartCategories.reduce(
          // @ts-expect-error - TS doesn't know that parsedData[parsedData.length - 1] contains all the categories
          (acc, category) => acc + parsedData[parsedData.length - 1][category],
          0,
        )
      : 0;
    const prevValue = parsedData[parsedData.length - 2]
      ? chartCategories.reduce(
          // @ts-expect-error - TS doesn't know that parsedData[parsedData.length - 2] contains all the categories
          (acc, category) => acc + parsedData[parsedData.length - 2][category],
          0,
        )
      : 0;

    return {
      value,
      prevValue,
      difference: value - prevValue,
      change: (value - prevValue) / prevValue || 0,
    };
  }, [parsedData, chartCategories]);

  const isSm = useBreakpoint('sm');

  return (
    <div>
      <Metric>{formatCurrency(metric.value, currency)}</Metric>
      <div className="flex gap-2 items-center">
        <p className="text-sm text-muted-foreground">
          {formatCurrency(metric.difference, currency, { signDisplay: 'always' })}
        </p>
        <PriceChangeBadge variant="default" percent={metric.change} />
      </div>

      <AreaChart
        data={parsedData}
        index="Date"
        categories={chartCategories}
        stack={!!subaccountIdsToShow}
        curveType="monotone"
        yAxisWidth={75}
        showYAxis={isSm}
        showXAxis={false}
        showLegend={false}
        showGridLines={false}
        showGradient={chartCategories.length <= 1}
        connectNulls
        showAnimation
        className="mt-6 h-48"
        valueFormatter={(value) => formatCurrency(value, currency)}
      />
    </div>
  );
}
