'use client';

import { PlusIcon, SlidersVerticalIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useCreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() =>
    accounts.map((account) => account.id),
  );

  const toggleAccountSelection = (accountId: string, selected: boolean) => {
    setSelectedAccountIds((ids) =>
      selected ? [...ids, accountId] : ids.filter((id) => id !== accountId),
    );
  };

  const visibleTransactions = transactions.filter((transaction) =>
    selectedAccountIds.includes(transaction.accountId),
  );

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
        {accounts.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" icon={SlidersVerticalIcon}>
                Accounts
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {accounts.map((account) => (
                <DropdownMenuCheckboxItem
                  key={account.id}
                  checked={selectedAccountIds.includes(account.id)}
                  onCheckedChange={(checked) => toggleAccountSelection(account.id, checked)}
                >
                  {account.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
