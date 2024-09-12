'use client';

import { CubeIcon } from '@radix-ui/react-icons';
import { createColumnHelper } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableFilter,
  DataTableGlobalFilter,
  DataTablePagination,
  DataTableResetFilters,
  DataTableRowSelectionIndicator,
  DataTableViewOptions,
  useDataTable,
} from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Account } from '@/lib/types/accounts.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { formatCurrency } from '@/lib/utils/formatters';

const columnHelper = createColumnHelper<TransactionWithAccount>();

const columns = [
  columnHelper.accessor((row) => row.startedDate, {
    id: 'date',
    header: 'Date',
    cell: ({ getValue }) => new Date(getValue()).toDateString(),
    enableSorting: false,
  }),
  columnHelper.accessor((row) => row.account.name, {
    id: 'account',
    header: 'Account',
    cell: ({ getValue }) => getValue(),
    filterFn: 'arrIncludesSome',
  }),
  columnHelper.accessor('amount.originalValue', {
    meta: { align: 'right' },
    header: 'Amount',
    cell: ({ row, getValue }) => formatCurrency(getValue(), row.original.originalCurrency),
  }),
];

interface DataTableTestProps {
  accounts: Account[];
  transactions: Paginated<Transaction>;
}

export function DataTableTest({ accounts, transactions }: DataTableTestProps) {
  const transactionsWithAccount = React.useMemo<TransactionWithAccount[]>(
    () =>
      transactions.data
        .map((transaction) => {
          const account = accounts.find((account) => account.id === transaction.accountId)!;
          const subaccount = account.subaccounts.find(
            (subaccount) => subaccount.id === transaction.subaccountId,
          )!;
          return {
            ...transaction,
            subaccount,
            account,
          };
        })
        .filter((transaction) => !!transaction.account),
    [transactions, accounts],
  );

  const accountOptions = React.useMemo(
    () =>
      accounts.map((account) => ({
        label: account.name,
        value: account.id,
        icon: CubeIcon,
      })),
    [accounts],
  );

  const [enableRowSelection, setEnableRowSelection] = React.useState(false);
  const [enableSorting, setEnableSorting] = React.useState(false);
  const [enablePagination, setEnablePagination] = React.useState(false);
  const [enableGlobalFilter, setEnableGlobalFilter] = React.useState(false);
  const [enableColumnFilters, setEnableColumnFilters] = React.useState(false);
  const [enableColumnHiding, setEnableColumnHiding] = React.useState(false);

  const table = useDataTable({
    columns,
    data: transactionsWithAccount,
    enablePagination,
    enableRowSelection,
    enableSorting,
  });

  return (
    <>
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2">
          <Switch id="row-selection" onCheckedChange={setEnableRowSelection} />
          <Label htmlFor="row-selection">Enable row selection</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sorting" onCheckedChange={setEnableSorting} />
          <Label htmlFor="sorting">Enable sorting</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sorting" onCheckedChange={setEnableGlobalFilter} />
          <Label htmlFor="sorting">Enable global filter</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sorting" onCheckedChange={setEnableColumnFilters} />
          <Label htmlFor="sorting">Enable column filters</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sorting" onCheckedChange={setEnableColumnHiding} />
          <Label htmlFor="sorting">Enable column hiding</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sorting" onCheckedChange={setEnablePagination} />
          <Label htmlFor="sorting">Enable pagination</Label>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          {enableGlobalFilter && <DataTableGlobalFilter table={table} className="sm:w-[200px]" />}
          {enableColumnFilters && (
            <>
              <DataTableFilter
                column={table.getColumn('account')!}
                title="Account"
                options={accountOptions}
              />
              <DataTableResetFilters table={table} />
            </>
          )}
          {enableColumnHiding && <DataTableViewOptions table={table} className="sm:ml-auto" />}
        </div>
        <DataTable
          table={table}
          emptyMessage="No transactions."
          enableRowSelection={enableRowSelection}
        />
        <div className="flex gap-x-4 gap-y-2 flex-col sm:flex-row sm:justify-between">
          {enableRowSelection && <DataTableRowSelectionIndicator table={table} />}
          {enablePagination && <DataTablePagination table={table} />}
        </div>
      </div>
    </>
  );
}
