'use client';

import { CellContext, ColumnDefTemplate, createColumnHelper } from '@tanstack/react-table';
import { EllipsisIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';

import { useUpdateTransactionDialog } from '@/components/dialogs/update-transaction-dialog';
import { AccountIcon } from '@/components/ui/account-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableFilter,
  DataTableGlobalFilter,
  DataTablePagination,
  DataTableResetFilters,
  DataTableRowSelectionIndicator,
  useDataTable,
  type DataTableFeatures,
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { formatCurrency, formatDateTime, formatExchange } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

const columnHelper = createColumnHelper<DataTableFeatures, TransactionWithAccount>();

const staticColumns = [
  columnHelper.accessor((row) => row.startedDate, {
    id: 'date',
    header: 'Date',
    cell: ({ getValue }) => <span className="whitespace-nowrap">{formatDateTime(getValue())}</span>,
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: ({ getValue, row }) => (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="min-w-[150px]">
            {!!row.original.counterpartyName && (
              <p className="font-medium">{row.original.counterpartyName}</p>
            )}
            <p className="text-ellipsis line-clamp-3">{getValue()}</p>
            {row.original.linkedTransaction && (
              <p>{formatExchange(row.original, row.original.linkedTransaction)}</p>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">{getValue()}</HoverCardContent>
      </HoverCard>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor((row) => row.account.name, {
    id: 'account',
    header: 'Account',
    cell: ({ getValue, row }) => (
      <div className="flex items-center">
        <AccountIcon category={row.original.account.category} className="w-4 h-4 mr-1 shrink-0" />
        <Link href={`/dashboard/accounts/${row.original.account.id}`}>{getValue()}</Link>
      </div>
    ),
    filterFn: 'arrHas',
  }),
  columnHelper.accessor((row) => row.subaccount.name, {
    id: 'subaccount',
    header: 'Subaccount',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor('amount.originalValue', {
    meta: { align: 'right' },
    header: 'Amount',
    cell: ({ row, getValue }) => (
      <span className="whitespace-nowrap">
        {formatCurrency(getValue(), row.original.originalCurrency)}
      </span>
    ),
  }),
  columnHelper.accessor('balance.originalValue', {
    meta: { align: 'right' },
    header: 'Balance',
    cell: ({ row, getValue }) => (
      <span className="whitespace-nowrap">
        {formatCurrency(getValue(), row.original.originalCurrency)}
      </span>
    ),
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: ({ getValue, row }) => (
      <div className="flex items-center gap-2">
        <span className="capitalize">{getValue()}</span>
        {row.original.dataSource === 'integration' && <Badge variant="outline">Bank sync</Badge>}
      </div>
    ),
    enableSorting: false,
  }),
];

interface TransactionsTableClientProps {
  accounts: Account[];
  transactions: Paginated<Transaction>;
}

export function TransactionsTableClient({ accounts, transactions }: TransactionsTableClientProps) {
  const transactionsWithAccount = useMemo<TransactionWithAccount[]>(
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

  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        label: account.name,
        value: account.name,
      })),
    [accounts],
  );

  const { openDialog: openUpdateTransactionDialog } = useUpdateTransactionDialog();

  const { execute: deleteTransaction, isExecuting: isDeleting } = useActionWithToast(
    apiActions.transactions.deleteTransaction,
    {
      loadingToast: 'Deleting transaction...',
      successToast: 'Transaction deleted!',
      errorToast: 'Failed to delete transaction. Please try again later.',
    },
  );

  const { executeAsync: deleteTransactions, isExecuting: isDeletingSelected } = useActionWithToast(
    apiActions.transactions.deleteTransactions,
    {
      loadingToast: 'Deleting selected transactions...',
      successToast: 'Transactions deleted!',
      errorToast: 'Failed to delete transaction. Please try again later.',
    },
  );

  const columns = useMemo(() => {
    const actionsCell: ColumnDefTemplate<
      CellContext<DataTableFeatures, TransactionWithAccount, unknown>
    > = ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <EllipsisIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                openUpdateTransactionDialog({
                  ...row.original,
                  amount: row.original.amount.originalValue,
                  currency: row.original.originalCurrency,
                  date: row.original.startedDate,
                })
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteTransaction(row.original.id)}>
              Delete
              <DropdownMenuShortcut>
                <Trash2Icon className="size-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    };

    return columnHelper.columns([
      ...staticColumns,
      columnHelper.display({
        id: 'actions',
        cell: actionsCell,
      }),
    ]);
  }, [deleteTransaction, openUpdateTransactionDialog]);

  const table = useDataTable({
    columns,
    data: transactionsWithAccount,
    enablePagination: true,
    enableRowSelection: true,
    enableSorting: true,
  });

  const selectedRowCount = table.getSelectedRowModel().rows.length;

  const deleteSelected = useCallback(async () => {
    const transactionIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    await deleteTransactions({ transactionIds });
    table.resetRowSelection();
  }, [deleteTransactions, table]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <DataTableGlobalFilter table={table} className="sm:w-[200px]" />
        <DataTableFilter
          table={table}
          columnId="account"
          title="Account"
          options={accountOptions}
        />
        <DataTableResetFilters table={table} />
        <Button
          variant="destructive"
          icon={Trash2Icon}
          className="h-8 px-2.5 sm:ml-auto"
          onClick={deleteSelected}
          disabled={selectedRowCount === 0 || isDeleting || isDeletingSelected}
          isLoading={isDeleting || isDeletingSelected}
        >
          Delete ({selectedRowCount})
        </Button>
      </div>

      <DataTable table={table} emptyMessage="No transactions." enableRowSelection />

      <div className="flex gap-x-4 gap-y-2 flex-col sm:flex-row sm:justify-between">
        <DataTableRowSelectionIndicator table={table} />
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
