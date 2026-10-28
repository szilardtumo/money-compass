'use client';

import { useRouter } from 'next/navigation';

import { TransactionCategoryPicker } from '@/components/categories/transaction-category-picker';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { formatPeriodLabel, parsePeriod } from '@/lib/utils/periods';

import { AnalyticsParams, getAnalyticsHref } from './analytics-params';

interface TransactionsSheetProps {
  params: AnalyticsParams;
  transactions: Transaction[];
  categories: Category[];
}

/**
 * The transactions of a category, a merchant, or the excluded ones in the selected period.
 */
export function TransactionsSheet({ params, transactions, categories }: TransactionsSheetProps) {
  const router = useRouter();
  const title = params.excluded
    ? 'Excluded from analytics'
    : params.merchant
      ? (transactions[0]?.merchant?.name ?? 'Merchant')
      : params.category === 'uncategorized'
        ? 'Uncategorized'
        : (categories.find((category) => category.id === params.category)?.name ?? 'Category');

  return (
    <Sheet
      open
      onOpenChange={() =>
        router.push(getAnalyticsHref({ period: params.period, view: params.view }), {
          scroll: false,
        })
      }
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {formatPeriodLabel(parsePeriod(params.period))}, {transactions.length} transaction
            {transactions.length === 1 ? '' : 's'}
          </SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col divide-y px-4">
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
      </SheetContent>
    </Sheet>
  );
}
