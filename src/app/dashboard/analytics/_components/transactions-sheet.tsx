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
 * The transactions excluded from analytics in the selected period.
 */
export function TransactionsSheet({
  params,
  transactions,
  accounts,
  isCut,
  categories,
}: TransactionsSheetProps) {
  const router = useRouter();
  return (
    <Sheet
      open
      onOpenChange={() =>
        router.push(getAnalyticsHref({ ...params, excluded: false }), {
          scroll: false,
        })
      }
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Excluded from analytics</SheetTitle>
          <SheetDescription>
            {params.period ? formatPeriodLabel(parsePeriod(params.period)) : 'Last 12 months'},{' '}
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
