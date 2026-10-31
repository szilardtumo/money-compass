'use client';

import { cn } from 'cn';
import Link from 'next/link';

import { CategoryIcon, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { TransactionCategoryBadge } from '@/components/categories/transaction-category-badge';
import { DrawerLink } from '@/components/drawers/drawer-link';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Category } from '@/lib/types/categories.types';
import { TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatExchange, formatTime } from '@/lib/utils/formatters';

import { TransactionActions } from './transaction-actions';

interface TransactionItemProps {
  transaction: TransactionWithAccount;
  /** For changing the category */
  categories: Category[];
}

export function TransactionItem({ transaction, categories }: TransactionItemProps) {
  const name =
    transaction.merchant?.name ||
    transaction.counterpartyName ||
    transaction.description ||
    'No description';
  const icon = transaction.category ?? {
    icon: transaction.type === 'exchange' ? 'arrow-left-right' : 'tag',
    color: UNCATEGORIZED_COLOR,
  };
  const details = [
    transaction.description !== name && transaction.description,
    transaction.linkedTransaction && formatExchange(transaction, transaction.linkedTransaction),
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${icon.color} 18%, transparent)` }}
      >
        <CategoryIcon category={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.merchant ? (
            <DrawerLink to={{ merchant: transaction.merchant.id }} className="hover:underline">
              {name}
            </DrawerLink>
          ) : (
            name
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {details.map((detail) => `${detail} · `)}
          <Link href={`/dashboard/accounts/${transaction.account.id}`} className="hover:underline">
            {transaction.account.name} ({transaction.subaccount.name})
          </Link>
          {/* Bank dates have no time */}
          {transaction.dataSource === 'manual' && ` · ${formatTime(transaction.startedDate)}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="flex items-baseline gap-2 whitespace-nowrap">
          {transaction.originalCurrency !== transaction.mainCurrency && (
            <span className="text-xs text-muted-foreground">
              {formatCurrency(transaction.amount.mainCurrencyValue, transaction.mainCurrency)}
            </span>
          )}
          <span
            className={cn(
              'text-sm font-medium',
              transaction.amount.originalValue > 0 && 'text-success',
            )}
          >
            {formatCurrency(transaction.amount.originalValue, transaction.originalCurrency)}
          </span>
        </p>
        <TransactionCategoryBadge transaction={transaction} />
      </div>
      <TransactionActions transaction={transaction} categories={categories}>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/transactions">Details</Link>
        </DropdownMenuItem>
      </TransactionActions>
    </div>
  );
}
