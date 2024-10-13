'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { DonutChart, chartColors } from '@/components/ui/chart';
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
import { Account } from '@/lib/types/accounts.types';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface AccountDistributionChartProps {
  accounts: Account[];
  mainCurrency: string;
}

export function AccountDistributionChart({
  accounts,
  mainCurrency,
}: AccountDistributionChartProps) {
  const data = useMemo(
    () =>
      accounts.map((account) => ({
        id: account.id,
        name: account.name,
        balance: account.totalBalance,
        mainCurrency: account.mainCurrency,
        category: account.category,
      })),
    [accounts],
  );

  const totalBalance = useMemo(
    () => data.reduce((acc, current) => acc + current.balance, 0),
    [data],
  );

  const [selectedSlice, setSelectedSlice] = useState<(typeof data)[number] | null>(null);

  return (
    <div>
      <DonutChart
        data={data}
        categories={['name']}
        index="balance"
        showTooltip
        showLabel
        label={formatCurrency(selectedSlice?.balance ?? totalBalance, mainCurrency)}
        variant="donut"
        className="h-48 mx-auto my-4"
        onValueChange={(value) => setSelectedSlice(value?.payload ?? null)}
        valueFormatter={(value) => formatCurrency(value as number, mainCurrency)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Share</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((item, i) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium whitespace-nowrap">
                <div
                  className={cn('inline-block align-baseline h-3 w-3 rounded-sm mr-2')}
                  style={{ backgroundColor: chartColors[i % chartColors.length] }}
                />
                {item.name}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="ml-1 capitalize">
                  {item.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge>{formatPercent(item.totalBalance / totalBalance)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.totalBalance, item.mainCurrency)}
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
