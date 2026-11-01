'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useCreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { Account } from '@/lib/types/accounts.types';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';

interface RecentTransactionsCardClientProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

export function RecentTransactionsCardClient({
  transactions,
  accounts,
  categories,
}: RecentTransactionsCardClientProps) {
  const { openDialog: openCreateTransactionDialog } = useCreateTransactionDialog();

  const [subaccountIds, setSubaccountIds] = useState<string[]>([]);
  const subaccountOptions = accounts.flatMap((account) =>
    account.subaccounts.map((subaccount) => ({
      label: subaccount.name,
      value: subaccount.id,
      group: account.name,
    })),
  );
  const visibleTransactions = subaccountIds.length
    ? transactions.filter((transaction) => subaccountIds.includes(transaction.subaccountId))
    : transactions;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-baseline space-y-0">
        <CardTitle>Recent transactions</CardTitle>
        {accounts.length === 1 && (
          <Button
            size="sm"
            onClick={() => openCreateTransactionDialog({ accountId: accounts[0].id })}
          >
            <PlusIcon className="size-4 mr-1" />
            Add <span className="sr-only sm:not-sr-only">&nbsp;transaction</span>
          </Button>
        )}
        {subaccountOptions.length > 1 && (
          <MultiSelectFilter
            title="Account"
            options={subaccountOptions}
            selected={subaccountIds}
            onSelectedChange={setSubaccountIds}
          />
        )}
      </CardHeader>
      <CardContent>
        <TransactionDayList
          transactions={visibleTransactions}
          accounts={accounts}
          categories={categories}
        />
      </CardContent>
      {visibleTransactions.length > 0 && (
        <CardFooter className="justify-center">
          <Link href="/dashboard/transactions" className={buttonVariants({ variant: 'ghost' })}>
            See All
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
