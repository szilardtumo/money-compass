'use client';

import { MixerVerticalIcon } from '@radix-ui/react-icons';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { mainCurrency } from '@/lib/constants';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/groupBy';

import { TransactionItem } from './transaction-item';

interface RecentTransactionsCardClientProps {
  transactions: Transaction[];
  accounts: SimpleAccount[];
  currencyMapper: CurrencyMapper;
}

export function RecentTransactionsCardClient({
  transactions,
  accounts,
  currencyMapper,
}: RecentTransactionsCardClientProps) {
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
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="link" disabled>
                  See All
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        </CardFooter>
      )}
    </Card>
  );
}
