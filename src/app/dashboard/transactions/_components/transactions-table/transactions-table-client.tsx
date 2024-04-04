'use client';

import { createColumnHelper } from '@tanstack/react-table';
import * as React from 'react';

import {
  DataTable,
  DataTableFilter,
  DataTableGlobalFilter,
  DataTablePagination,
  DataTableResetFilters,
  DataTableRowSelectionIndicator,
  useDataTable,
} from '@/components/ui/data-table';
import { SimpleAccount } from '@/lib/types/accounts.types';
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
  columnHelper.accessor('amount', {
    meta: { align: 'right' },
    header: 'Amount',
    cell: ({ row, getValue }) => formatCurrency(getValue(), row.original.account.currency),
  }),
];

interface TransactionsTableClientProps {
  accounts: SimpleAccount[];
  transactions: Paginated<Transaction>;
}

export function TransactionsTableClient({ accounts, transactions }: TransactionsTableClientProps) {
  const transactionsWithAccount = React.useMemo<TransactionWithAccount[]>(
    () =>
      transactions.data
        .map((transaction) => ({
          ...transaction,
          account: accounts.find((account) => account.subaccountId === transaction.subaccountId)!,
        }))
        .filter((transaction) => !!transaction.account),
    [transactions, accounts],
  );

  const accountOptions = React.useMemo(
    () =>
      accounts.map((account) => ({
        label: account.name,
        value: account.subaccountId,
      })),
    [accounts],
  );

  const table = useDataTable({
    columns,
    data: transactionsWithAccount,
    enablePagination: true,
    enableRowSelection: true,
    enableSorting: true,
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <DataTableGlobalFilter table={table} className="sm:w-[200px]" />
        <DataTableFilter
          column={table.getColumn('account')!}
          title="Account"
          options={accountOptions}
        />
        <DataTableResetFilters table={table} />
      </div>

      <DataTable table={table} emptyMessage="No transactions." enableRowSelection />

      <div className="flex gap-x-4 gap-y-2 flex-col sm:flex-row sm:justify-between">
        <DataTableRowSelectionIndicator table={table} />
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
