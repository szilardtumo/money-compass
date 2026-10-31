'use client';

import { isThisYear, isToday, isYesterday } from 'date-fns';
import { useMemo } from 'react';

import { Account } from '@/lib/types/accounts.types';
import { Category } from '@/lib/types/categories.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/group-by';

import { TransactionItem } from './transaction-item';

const formatDay = (date: string) =>
  isToday(date)
    ? 'Today'
    : isYesterday(date)
      ? 'Yesterday'
      : formatDate(date, isThisYear(date) ? 'EEE, d MMM' : 'EEE, d MMM yyyy');

interface TransactionDayListProps {
  transactions: Transaction[];
  accounts: Account[];
  /** For changing the categories */
  categories: Category[];
}

/**
 * Transactions grouped by day, with the day's total in the main currency.
 */
export function TransactionDayList({
  transactions,
  accounts,
  categories,
}: TransactionDayListProps) {
  const days = useMemo(() => {
    const subaccounts = new Map(
      accounts.flatMap((account) =>
        account.subaccounts.map((subaccount) => [subaccount.id, { account, subaccount }]),
      ),
    );
    const withAccount = transactions.flatMap((transaction): TransactionWithAccount[] => {
      const found = subaccounts.get(transaction.subaccountId);
      return found ? [{ ...transaction, ...found }] : [];
    });

    return Object.entries(
      groupBy(withAccount, (transaction) => new Date(transaction.startedDate).toDateString()),
    ).map(([date, items]) => ({
      date,
      transactions: items,
      total: items.reduce((sum, item) => sum + item.amount.mainCurrencyValue, 0),
      currency: items[0].mainCurrency,
    }));
  }, [transactions, accounts]);

  if (!days.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No transactions.</p>;
  }

  return (
    <div className="space-y-10">
      {days.map((day) => (
        <div key={day.date}>
          <div className="flex justify-between text-sm font-bold text-muted-foreground uppercase">
            <span>{formatDay(day.date)}</span>
            <span>{formatCurrency(day.total, day.currency)}</span>
          </div>
          <div className="mt-3 space-y-3">
            {day.transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                categories={categories}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
