'use client';

import { DotsHorizontalIcon, ReloadIcon, TrashIcon } from '@radix-ui/react-icons';
import { CellContext, ColumnDefTemplate, createColumnHelper } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUpdateTransactionDialog } from '@/components/providers/update-transaction-dialog-provider';
import { AccountIcon } from '@/components/ui/account-avatar';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableFilter,
  DataTableGlobalFilter,
  DataTablePagination,
  DataTableResetFilters,
  DataTableRowSelectionIndicator,
  useDataTable,
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { NavLink } from '@/components/ui/nav-link';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { ActionErrorCode, Paginated } from '@/lib/types/transport.types';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

const columnHelper = createColumnHelper<TransactionWithAccount>();

const staticColumns = [
  columnHelper.accessor((row) => row.startedDate, {
    id: 'date',
    header: 'Date',
    cell: ({ getValue }) => <span className="whitespace-nowrap">{formatDateTime(getValue())}</span>,
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: ({ getValue }) => (
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="min-w-[150px] overflow-ellipsis line-clamp-3">{getValue()}</span>
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
        <AccountIcon category={row.original.account.category} className="w-4 h-4 mr-1" />
        <NavLink href={`/dashboard/accounts/${row.original.account.id}`}>{getValue()}</NavLink>
      </div>
    ),
    filterFn: 'arrIncludesSome',
  }),
  columnHelper.accessor('amount.originalValue', {
    meta: { align: 'right' },
    header: 'Amount',
    cell: ({ row, getValue }) => (
      <span className="whitespace-nowrap">
        {formatCurrency(getValue(), row.original.account.originalCurrency)}
      </span>
    ),
  }),
  columnHelper.accessor('balance.originalValue', {
    meta: { align: 'right' },
    header: 'Balance',
    cell: ({ row, getValue }) => (
      <span className="whitespace-nowrap">
        {formatCurrency(getValue(), row.original.account.originalCurrency)}
      </span>
    ),
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
    enableSorting: false,
  }),
];

interface TransactionsTableClientProps {
  accounts: SimpleAccount[];
  transactions: Paginated<Transaction>;
}

export function TransactionsTableClient({ accounts, transactions }: TransactionsTableClientProps) {
  const transactionsWithAccount = useMemo<TransactionWithAccount[]>(
    () =>
      transactions.data
        .map((transaction) => ({
          ...transaction,
          account: accounts.find((account) => account.subaccountId === transaction.subaccountId)!,
        }))
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
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    setIsDeleting(true);
    const promise = apiActions.transactions.deleteTransactions([transactionId]);

    toast.promise(createToastPromise(promise), {
      loading: 'Deleting transaction...',
      success: 'Transaction deleted!',
      error: (error) =>
        error?.code === ActionErrorCode.NotLatestTransactions
          ? 'Failed to delete transaction. Only the most recent transactions can be deleted'
          : 'Failed to delete transaction. Please try again later.',
    });

    await promise;
    setIsDeleting(false);
  }, []);

  const columns = useMemo(() => {
    const actionsCell: ColumnDefTemplate<CellContext<TransactionWithAccount, any>> = ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                openUpdateTransactionDialog({
                  ...row.original,
                  amount: row.original.amount.originalValue,
                })
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteTransaction(row.original.id)}>
              Delete
              <DropdownMenuShortcut>
                <TrashIcon />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    };

    return [
      ...staticColumns,
      columnHelper.display({
        id: 'actions',
        cell: actionsCell,
      }),
    ];
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
    setIsDeleting(true);
    const transactionIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    const promise = apiActions.transactions.deleteTransactions(transactionIds);

    toast.promise(createToastPromise(promise), {
      loading: 'Deleting selected transactions...',
      success: 'Transactions deleted!',
      error: (error) =>
        error?.code === ActionErrorCode.NotLatestTransactions
          ? 'Failed to delete transactions. Only the most recent transactions can be deleted'
          : 'Failed to delete transactions. Please try again later.',
    });

    await promise;
    table.resetRowSelection();
    setIsDeleting(false);
  }, [table]);

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
        <Button
          variant="destructive"
          className="h-8 px-2.5 sm:ml-auto"
          onClick={deleteSelected}
          disabled={selectedRowCount === 0 || isDeleting}
        >
          {isDeleting ? (
            <ReloadIcon className="mr-2 animate-spin" />
          ) : (
            <TrashIcon className="mr-2" />
          )}
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
