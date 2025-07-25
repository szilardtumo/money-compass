'use client';
'use no memo';

import { DotsHorizontalIcon, TrashIcon } from '@radix-ui/react-icons';
import { CellContext, ColumnDefTemplate, createColumnHelper } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';

import { useUpdateTransactionDialog } from '@/components/dialogs/update-transaction-dialog';
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
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
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
          <span className="min-w-[150px] text-ellipsis line-clamp-3">{getValue()}</span>
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
        <NavLink href={`/dashboard/accounts/${row.original.account.id}`}>{getValue()}</NavLink>
      </div>
    ),
    filterFn: 'arrIncludesSome',
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
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
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
    const actionsCell: ColumnDefTemplate<CellContext<TransactionWithAccount, unknown>> = ({
      row,
    }) => {
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
    const transactionIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    await deleteTransactions({ transactionIds });
    table.resetRowSelection();
  }, [deleteTransactions, table]);

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
          icon={TrashIcon}
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
