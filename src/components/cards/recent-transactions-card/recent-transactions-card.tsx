'use client';

import { MixerVerticalIcon, PlusIcon } from '@radix-ui/react-icons';
import { useMemo, useState } from 'react';

import { useCreateTransactionDialog } from '@/components/providers/create-transaction-dialog-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavLink } from '@/components/ui/nav-link';
import { Account } from '@/lib/types/accounts.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/group-by';

import { TransactionItem } from './transaction-item';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  accounts: Account[];
  mainCurrency: string;
}

export function RecentTransactionsCard({
  transactions,
  accounts,
  mainCurrency,
}: RecentTransactionsCardProps) {
  const { openDialog: openCreateTransactionDialog } = useCreateTransactionDialog();

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() =>
    accounts.map((account) => account.id),
  );

  const toggleAccountSelection = (accountId: string, selected: boolean) => {
    setSelectedAccountIds((ids) =>
      selected ? [...ids, accountId] : ids.filter((id) => id !== accountId),
    );
  };

  const groupedTransactions = useMemo(() => {
    const transactionsWithAccount = transactions
      .filter((transaction) => selectedAccountIds.includes(transaction.accountId))
      .map((transaction) => {
        const account = accounts.find((account) => account.id === transaction.accountId);
        const subaccount = account?.subaccounts.find((subaccount) => subaccount.id === transaction.subaccountId);

        return { ...transaction, account, subaccount };
      })
      .filter(
        (transaction): transaction is TransactionWithAccount =>
          !!transaction.account && !!transaction.subaccount,
      );

    const groups = groupBy(transactionsWithAccount, (transaction) =>
      new Date(transaction.startedDate).toDateString(),
    );

    return Object.entries(groups).map(([date, items]) => ({
      date,
      transactions: items,
      totalAmount: items.reduce((acc, item) => acc + item.amount.mainCurrencyValue, 0),
    }));
  }, [transactions, accounts, selectedAccountIds]);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-baseline space-y-0">
        <CardTitle>Recent transactions</CardTitle>
        {accounts.length === 1 && (
          <Button
            size="sm"
            onClick={() => openCreateTransactionDialog({ account: accounts[0].id })}
          >
            <PlusIcon className=" mr-1" />
            Add <span className="sr-only sm:not-sr-only">&nbsp;transaction</span>
          </Button>
        )}
        {accounts.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MixerVerticalIcon className="w-4 h-4 mr-2" />
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
      <CardContent className="space-y-10">
        {groupedTransactions.map((group) => (
          <div key={group.date}>
            <div className="flex justify-between text-sm text-muted-foreground font-bold uppercase">
              <span>{formatDate(group.date)}</span>
              <span>{formatCurrency(group.totalAmount, mainCurrency)}</span>
            </div>
            <div className="mt-3 space-y-3">
              {group.transactions.map((item) => (
                <TransactionItem key={item.id} transaction={item} />
              ))}
            </div>
          </div>
        ))}
        {groupedTransactions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">No transactions.</p>
        )}
      </CardContent>
      {groupedTransactions.length > 0 && (
        <CardFooter className="justify-center">
          <NavLink href="/dashboard/transactions" className={buttonVariants({ variant: 'ghost' })}>
            See All
          </NavLink>
        </CardFooter>
      )}
    </Card>
  );
}
