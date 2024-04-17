'use client';

import { MixerVerticalIcon, PlusIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
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
import { mainCurrency } from '@/lib/constants';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/groupBy';

import { TransactionItem } from './transaction-item';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  accounts: SimpleAccount[];
  currencyMapper: CurrencyMapper;
}

export function RecentTransactionsCard({
  transactions,
  accounts,
  currencyMapper,
}: RecentTransactionsCardProps) {
  const { openDialog: openCreateTransactionDialog } = useCreateTransactionDialog();

  const [selectedsubAccountIds, setSelectedSubaccountIds] = useState<string[]>(() =>
    accounts.map((account) => account.subaccountId),
  );

  const toggleSubaccountSelection = (subaccountId: string, selected: boolean) => {
    setSelectedSubaccountIds((ids) =>
      selected ? [...ids, subaccountId] : ids.filter((id) => id !== subaccountId),
    );
  };

  const groupedTransactions = useMemo(() => {
    const transactionsWithAccount = transactions
      .filter((transaction) => selectedsubAccountIds.includes(transaction.subaccountId))
      .map((transaction) => ({
        ...transaction,
        account: accounts.find((account) => account.subaccountId === transaction.subaccountId),
      }))
      .filter((transaction): transaction is TransactionWithAccount => !!transaction.account);

    const groups = groupBy(transactionsWithAccount, (transaction) =>
      new Date(transaction.startedDate).toDateString(),
    );

    return Object.entries(groups).map(([date, items]) => ({
      date,
      transactions: items,
      totalAmount: items.reduce(
        (acc, item) => acc + item.amount * currencyMapper[item.account.currency],
        0,
      ),
    }));
  }, [transactions, accounts, currencyMapper, selectedsubAccountIds]);

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
                  key={account.subaccountId}
                  checked={selectedsubAccountIds.includes(account.subaccountId)}
                  onCheckedChange={(checked) =>
                    toggleSubaccountSelection(account.subaccountId, checked)
                  }
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
          <Link href="/dashboard/transactions" className={buttonVariants({ variant: 'ghost' })}>
            See All
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
