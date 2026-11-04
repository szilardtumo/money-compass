'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { PlaneIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { BulkCategoryPicker } from '@/components/categories/bulk-category-picker';
import { CATEGORY_TOASTS } from '@/components/categories/category-picker';
import { TransactionCategoryBadge } from '@/components/categories/transaction-category-badge';
import { useAddToTripDialog } from '@/components/dialogs/add-to-trip-dialog';
import { DrawerLink } from '@/components/drawers/drawer-link';
import { TransactionActions } from '@/components/transactions/transaction-actions';
import { TransactionAmount, TransactionSummary } from '@/components/transactions/transaction-item';
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
  type DataTableFeatures,
} from '@/components/ui/data-table';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { Category } from '@/lib/types/categories.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { formatCurrency, formatDay, formatTime, formatUtcDay } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

const columnHelper = createColumnHelper<DataTableFeatures, TransactionWithAccount>();

const staticColumns = [
  columnHelper.accessor((row) => new Date(row.startedDate), {
    id: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <p>{formatDay(row.original.startedDate)}</p>
        {/* Bank dates have no time */}
        {row.original.dataSource === 'manual' && (
          <p className="text-xs text-muted-foreground">{formatTime(row.original.startedDate)}</p>
        )}
      </div>
    ),
  }),
  // Searched by everything the bank said about it
  columnHelper.accessor(
    (row) => [row.merchant?.name, row.counterpartyName, row.description].join(' '),
    {
      id: 'transaction',
      header: 'Transaction',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex max-w-80 min-w-48">
          <TransactionSummary transaction={row.original} />
        </div>
      ),
    },
  ),
  columnHelper.accessor(
    (row) => row.category?.id ?? (row.excluded ? 'excluded' : 'uncategorized'),
    {
      id: 'category',
      header: 'Category',
      filterFn: 'arrHas',
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => <TransactionCategoryBadge transaction={row.original} />,
    },
  ),
  columnHelper.accessor('subaccountId', {
    id: 'account',
    header: 'Account',
    filterFn: 'arrHas',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <DrawerLink
        to={{ account: row.original.account.id }}
        className="flex items-center gap-1.5 hover:underline"
      >
        <AccountIcon category={row.original.account.category} className="size-4 shrink-0" />
        {row.original.account.name}
        <span className="text-muted-foreground">{row.original.subaccount.name}</span>
      </DrawerLink>
    ),
  }),
  // Sorted by the value in the main currency, so different currencies compare
  columnHelper.accessor('amount.mainCurrencyValue', {
    id: 'amount',
    header: 'Amount',
    enableGlobalFilter: false,
    meta: { align: 'right' },
    cell: ({ row }) => <TransactionAmount transaction={row.original} />,
  }),
  columnHelper.accessor('balance.originalValue', {
    id: 'balance',
    header: 'Balance',
    enableGlobalFilter: false,
    meta: { align: 'right' },
    cell: ({ row, getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatCurrency(getValue(), row.original.originalCurrency)}
      </span>
    ),
  }),
];

interface TransactionsTableClientProps {
  accounts: Account[];
  transactions: Paginated<Transaction>;
  categories: Category[];
}

export function TransactionsTableClient({
  accounts,
  transactions,
  categories,
}: TransactionsTableClientProps) {
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
      accounts.flatMap((account) =>
        account.subaccounts.map((subaccount) => ({
          label: subaccount.name,
          value: subaccount.id,
          group: account.name,
        })),
      ),
    [accounts],
  );

  const categoryOptions = useMemo(
    () => [
      { label: 'Uncategorized', value: 'uncategorized' },
      { label: 'Exchanges, top-ups, corrections', value: 'excluded' },
      ...categories.map((category) => ({ label: category.name, value: category.id })),
    ],
    [categories],
  );

  const { executeAsync: setTransactionCategory } = useActionWithToast(
    apiActions.transactions.setTransactionCategory,
    CATEGORY_TOASTS,
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
    return columnHelper.columns([
      ...staticColumns,
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => (
          <TransactionActions transaction={row.original} categories={categories} />
        ),
      }),
    ]);
  }, [categories]);

  const table = useDataTable({
    columns,
    getRowId: (row) => row.id,
    data: transactionsWithAccount,
    enablePagination: true,
    enableRowSelection: true,
    enableSorting: true,
    initialSorting: [{ id: 'date', desc: true }],
  });

  const selectedRowCount = table.getSelectedRowModel().rows.length;

  const categorizeSelected = useCallback(
    async (categoryId: string | null) => {
      const transactionIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
      await setTransactionCategory({ transactionIds, categoryId });
      table.resetRowSelection();
    },
    [setTransactionCategory, table],
  );

  const { openDialog: openAddToTripDialog } = useAddToTripDialog();
  const addSelectedToTrip = () => {
    const selected = table.getSelectedRowModel().rows.map((row) => row.original);
    const days = selected.map((transaction) => formatUtcDay(transaction.startedDate)).toSorted();
    openAddToTripDialog({
      transactionIds: selected.map((transaction) => transaction.id),
      startDate: days[0],
      endDate: days.at(-1)!,
    });
    table.resetRowSelection();
  };

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
        <DataTableFilter
          table={table}
          columnId="category"
          title="Category"
          options={categoryOptions}
        />
        <DataTableResetFilters table={table} />
        <BulkCategoryPicker
          categories={categories}
          selectedCount={selectedRowCount}
          clearLabel="Remove their own category"
          onSelect={categorizeSelected}
        />
        <Button
          variant="outline"
          icon={PlaneIcon}
          className="h-8 px-2.5"
          onClick={addSelectedToTrip}
          disabled={selectedRowCount === 0}
        >
          Add to trip ({selectedRowCount})
        </Button>
        <Button
          variant="destructive"
          icon={Trash2Icon}
          className="h-8 px-2.5"
          onClick={deleteSelected}
          disabled={selectedRowCount === 0 || isDeletingSelected}
          isLoading={isDeletingSelected}
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
