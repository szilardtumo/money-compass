'use client';

import { TransactionCategoryPicker } from '@/components/categories/transaction-category-picker';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
}

/**
 * A compact list of transactions with their category pickers, for sheets.
 */
export function TransactionList({ transactions, categories }: TransactionListProps) {
  if (!transactions.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No transactions.</p>;
  }

  return (
    <ul className="flex flex-col divide-y">
      {transactions.map((transaction) => (
        <li key={transaction.id} className="flex items-start gap-3 py-3">
          <div className="mr-auto flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium">
              {transaction.merchant?.name ||
                transaction.counterpartyName ||
                transaction.description ||
                'No description'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(transaction.startedDate)}
            </span>
            <TransactionCategoryPicker transaction={transaction} categories={categories} />
          </div>
          <span className="whitespace-nowrap text-sm font-medium">
            {formatCurrency(transaction.amount.originalValue, transaction.originalCurrency)}
          </span>
        </li>
      ))}
    </ul>
  );
}
