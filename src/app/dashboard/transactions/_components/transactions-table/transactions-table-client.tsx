'use client';

import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import * as React from 'react';

import { DataTable } from '@/components/ui/data-table';
import { cn } from '@/lib/cn';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { Paginated } from '@/lib/types/transport.types';
import { formatCurrency } from '@/lib/utils/formatters';

const columnHelper = createColumnHelper<TransactionWithAccount>();

const columns: ColumnDef<TransactionWithAccount, any>[] = [
  columnHelper.accessor((row) => new Date(row.startedDate).toDateString(), {
    id: 'date',
    header: () => <div>Date</div>,
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
    enableSorting: false,
  }),
  columnHelper.accessor('subaccountId', {
    header: () => <div>Account</div>,
    cell: ({ row }) => (row.getIsGrouped() ? null : row.original.account?.name),
    filterFn: 'arrIncludesSome',
  }),
  {
    accessorKey: 'amount',
    aggregationFn: 'sum',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row, getValue }) => (
      <div className={cn('text-right', row.getIsGrouped() && 'text-muted-foreground')}>
        {row.original.account
          ? formatCurrency(getValue(), row.original.account?.currency)
          : getValue()}
      </div>
    ),
  },
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

  return (
    <>
      {/* <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Accounts <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {accounts.map((account) => {
              return (
                <DropdownMenuCheckboxItem
                  key={account.subaccountId}
                  checked={(
                    (table.getColumn('subaccountId')?.getFilterValue() ?? []) as string[]
                  ).includes(account.subaccountId)}
                  onCheckedChange={(checked) =>
                    table
                      .getColumn('subaccountId')
                      ?.setFilterValue((filterValue: string[] = []) =>
                        checked
                          ? [...filterValue, account.subaccountId]
                          : filterValue.filter((v) => v !== account.subaccountId),
                      )
                  }
                >
                  {account.name}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}
      <DataTable
        columns={columns}
        data={transactionsWithAccount}
        enableSorting
        enablePagination
        enableRowSelection
        emptyMessage="No transactions."
      />
    </>
  );
}
