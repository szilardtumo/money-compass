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
import { capitalize, formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/groupBy';

interface AccountCategoryDistributionChartProps {
  accounts: SimpleAccount[];
  currencyMapper: CurrencyMapper;
}

export function AccountCategoryDistributionChart({
  accounts,
  currencyMapper,
}: AccountCategoryDistributionChartProps) {
  const data = useMemo(() => {
    const groups = groupBy(accounts, (account) => capitalize(account.category));

    return Object.entries(groups).map(([category, items]) => ({
      id: category,
      category,
      balance: items.reduce(
        (acc, current) => acc + current.balance * currencyMapper[current.currency],
        0,
      ),
    }));
  }, [accounts, currencyMapper]);

  const totalBalance = useMemo(
    () => data.reduce((acc, current) => acc + current.balance, 0),
    [data],
  );

  const [selectedSlice, setSelectedSlice] = useState<(typeof data)[number] | null>(null);

  return (
    <div>
      <DonutChart
        data={data}
        index="category"
        category="balance"
        showAnimation
        showTooltip
        showLabel
        label={formatCurrency(selectedSlice?.balance ?? totalBalance, mainCurrency)}
        variant="donut"
        className="h-48 my-4"
        colors={chartColors}
        onValueChange={setSelectedSlice}
        valueFormatter={(value) => formatCurrency(value, mainCurrency)}
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
                  className={cn(
                    'inline-block align-baseline h-3 w-3 rounded-sm mr-2',
                    `bg-${chartColors[i]}-500`,
                  )}
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
