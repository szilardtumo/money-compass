'use client';

import { useRouter } from 'next/navigation';

import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Account } from '@/lib/types/accounts.types';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { formatPeriodLabel, parsePeriod } from '@/lib/utils/periods';

import { AnalyticsParams, getAnalyticsHref } from './analytics-params';

interface TransactionsSheetProps {
  params: AnalyticsParams;
  transactions: Transaction[];
  accounts: Account[];
  /** Whether there are more transactions than the latest ones shown */
  isCut: boolean;
  categories: Category[];
}

/**
 * The transactions of a category, a merchant, or the excluded ones in the selected period.
 */
export function TransactionsSheet({
  params,
  transactions,
  accounts,
  isCut,
  categories,
}: TransactionsSheetProps) {
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
            {formatPeriodLabel(parsePeriod(params.period))},{' '}
            {isCut
              ? `the latest ${transactions.length} transactions`
              : `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <TransactionDayList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
