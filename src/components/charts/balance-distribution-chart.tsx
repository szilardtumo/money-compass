'use client';

import { cn } from 'cn';
import { useState } from 'react';

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
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface BalanceDistributionChartProps {
  /** The header of the groups' column */
  label: string;
  /** In the main currency, with a detail under the name, like the balance in its own currency */
  groups: { name: string; balance: number; detail?: string }[];
  mainCurrency: string;
}

/**
 * A donut of the balance by group, like account categories or currencies, with a table of them.
 */
export function BalanceDistributionChart({
  label,
  groups,
  mainCurrency,
}: BalanceDistributionChartProps) {
  const totalBalance = groups.reduce((acc, current) => acc + current.balance, 0);
  const [selectedSlice, setSelectedSlice] = useState<(typeof groups)[number] | null>(null);

  return (
    <div>
      <DonutChart
        data={groups}
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
            <TableHead>{label}</TableHead>
            <TableHead>Share</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((item, i) => (
            <TableRow key={item.name}>
              <TableCell className="font-medium whitespace-nowrap">
                <div
                  className={cn('inline-block align-baseline h-3 w-3 rounded-sm mr-2')}
                  style={{ backgroundColor: chartColors[i % chartColors.length] }}
                />
                {item.name}
              </TableCell>
              <TableCell>
                <Badge>{formatPercent(item.balance / totalBalance)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.balance, mainCurrency)}
                {item.detail && <div className="text-xs text-muted-foreground">{item.detail}</div>}
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
