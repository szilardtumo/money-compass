'use client';

import { DonutChart } from '@tremor/react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { mainCurrency } from '@/lib/constants';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { chartColors } from '@/lib/utils/charts';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface AccountDistributionChartProps {
  accounts: SimpleAccount[];
  currencyMapper: CurrencyMapper;
}

export function AccountDistributionChart({
  accounts,
  currencyMapper,
}: AccountDistributionChartProps) {
  const data = useMemo(
    () =>
      accounts.map((account) => ({
        id: account.id,
        name: account.name,
        balance: account.balance,
        currency: account.currency,
        balanceInMainCurrency: account.balance * currencyMapper[account.currency],
        category: account.category,
      })),
    [accounts, currencyMapper],
  );

  const totalBalance = useMemo(
    () => data.reduce((acc, current) => acc + current.balanceInMainCurrency, 0),
    [data],
  );

  const [selectedSlice, setSelectedSlice] = useState<(typeof data)[number] | null>(null);

  return (
    <div>
      <DonutChart
        data={data}
        index="name"
        category="balanceInMainCurrency"
        showAnimation
        showTooltip
        showLabel
        label={formatCurrency(selectedSlice?.balanceInMainCurrency ?? totalBalance, mainCurrency)}
        variant="donut"
        className="h-48 my-4"
        colors={chartColors}
        onValueChange={setSelectedSlice}
        valueFormatter={(value) => formatCurrency(value, mainCurrency)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Share</TableHead>
            <TableHead className="text-right">Balance (in original currency)</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, i) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium whitespace-nowrap">
                <div
                  className={cn(
                    'inline-block align-baseline h-3 w-3 rounded-sm mr-2',
                    `bg-${chartColors[i]}-500`,
                  )}
                />
                {item.name}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="ml-1 capitalize">
                  {item.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge>{formatPercent(item.balanceInMainCurrency / totalBalance)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.balance, item.currency)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.balanceInMainCurrency, mainCurrency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell colSpan={4} className="text-right">
              {formatCurrency(totalBalance, mainCurrency)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
