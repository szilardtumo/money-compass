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
import { capitalize, formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/group-by';

interface AccountCategoryDistributionChartProps {
  accounts: Account[];
  mainCurrency: string;
}

export function AccountCategoryDistributionChart({
  accounts,
  mainCurrency,
}: AccountCategoryDistributionChartProps) {
  const data = useMemo(() => {
    const groups = groupBy(accounts, (account) => capitalize(account.category));

    return Object.entries(groups).map(([category, items]) => ({
      id: category,
      category,
      balance: items.reduce((acc, current) => acc + current.totalBalance, 0),
    }));
  }, [accounts]);

  const totalBalance = useMemo(
    () => data.reduce((acc, current) => acc + current.balance, 0),
    [data],
  );

  const [selectedSlice, setSelectedSlice] = useState<(typeof data)[number] | null>(null);

  return (
    <div>
      <DonutChart
        data={data}
        categories={['category']}
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
            <TableHead>Category</TableHead>
            <TableHead>Share</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, i) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium whitespace-nowrap">
                <div
                  className={cn('inline-block align-baseline h-3 w-3 rounded-sm mr-2')}
                  style={{ backgroundColor: chartColors[i % chartColors.length] }}
                />
                {item.category}
              </TableCell>
              <TableCell>
                <Badge>{formatPercent(item.balance / totalBalance)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.balance, mainCurrency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell colSpan={2} className="text-right">
              {formatCurrency(totalBalance, mainCurrency)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
