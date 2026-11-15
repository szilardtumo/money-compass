'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';

import { useDrawerHref } from '@/components/drawers/drawer-link';
import { useNavigate } from '@/components/navigation-progress';
import { Badge } from '@/components/ui/badge';
import { DataTable, useDataTable, type DataTableFeatures } from '@/components/ui/data-table';
import { TrendLine } from '@/components/ui/trend-line';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { Holding } from '@/server/api/investments/overview';

const columnHelper = createColumnHelper<DataTableFeatures, Holding>();

interface HoldingsTableProps {
  holdings: Holding[];
  mainCurrency: string;
}

export function HoldingsTable({ holdings, mainCurrency }: HoldingsTableProps) {
  const navigate = useNavigate();
  const getDrawerHref = useDrawerHref();
  const columns = useMemo(() => {
    const total = holdings.reduce((sum, holding) => sum + holding.value, 0);
    const format = (value: number, options: Intl.NumberFormatOptions = {}) =>
      formatCurrency(value, mainCurrency, options);

    return columnHelper.columns([
      columnHelper.accessor('symbol', {
        header: 'Name',
        cell: ({ row: { original: holding } }) => (
          <div className="min-w-32">
            <div className="flex items-center gap-2 font-medium">
              {holding.symbol}
              {holding.isUnpriced && <Badge variant="outline">Last IBKR price</Badge>}
            </div>
            <div className="max-w-44 truncate text-xs text-muted-foreground">{holding.name}</div>
          </div>
        ),
      }),
      columnHelper.accessor('accountName', {
        header: 'Account',
        cell: ({ row: { original: holding } }) => (
          <div className="whitespace-nowrap">
            {holding.accountName}
            <div className="text-xs text-muted-foreground">{holding.currency.toUpperCase()}</div>
          </div>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: 'Quantity',
        meta: { align: 'right' },
        cell: ({ getValue }) => getValue().toLocaleString('en-US', { maximumFractionDigits: 4 }),
      }),
      columnHelper.accessor('lastPrice', {
        header: 'Price',
        meta: { align: 'right' },
        cell: ({ row: { original: holding } }) => (
          <div className="whitespace-nowrap">
            {formatCurrency(holding.lastPrice, holding.priceCurrency)}
            <div className="text-xs text-muted-foreground">
              Avg. cost {formatCurrency(holding.averageCost, holding.currency)}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('value', {
        header: 'Value',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="font-medium whitespace-nowrap">{format(getValue())}</span>
        ),
      }),
      columnHelper.accessor((holding) => (total ? holding.value / total : 0), {
        id: 'weight',
        header: 'Weight',
        meta: { align: 'right' },
        cell: ({ getValue }) => formatPercent(getValue(), { maximumFractionDigits: 1 }),
      }),
      columnHelper.accessor('unrealizedGain', {
        header: 'Gain',
        meta: { align: 'right' },
        cell: ({ row: { original: holding } }) => {
          const cost = holding.value - holding.unrealizedGain;
          return (
            <div
              className={
                holding.unrealizedGain > 0
                  ? 'text-success'
                  : holding.unrealizedGain < 0
                    ? 'text-destructive'
                    : undefined
              }
            >
              <div className="whitespace-nowrap">
                {format(holding.unrealizedGain, { signDisplay: 'exceptZero' })}
              </div>
              {cost > 0 && (
                <div className="text-xs">
                  {formatPercent(holding.unrealizedGain / cost, {
                    maximumFractionDigits: 1,
                    signDisplay: 'exceptZero',
                  })}
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'trend',
        header: '30 days',
        cell: ({ row: { original: holding } }) =>
          holding.closes.length > 1 && (
            <TrendLine
              values={holding.closes}
              color={
                holding.closes.at(-1)! >= holding.closes[0]
                  ? 'var(--success)'
                  : 'var(--destructive)'
              }
              className="w-20"
            />
          ),
      }),
    ]);
  }, [holdings, mainCurrency]);

  const table = useDataTable({
    columns,
    data: holdings,
    getRowId: (holding) => `${holding.subaccountId}:${holding.securityId}`,
    enableSorting: true,
    initialSorting: [{ id: 'value', desc: true }],
  });

  return (
    <DataTable
      table={table}
      emptyMessage="No open positions."
      onRowClick={(holding) => navigate(getDrawerHref({ holding: holding.securityId }))}
    />
  );
}
