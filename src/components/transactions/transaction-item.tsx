'use client';

import { cn } from 'cn';
import { PlaneIcon } from 'lucide-react';
import Link from 'next/link';
import { Fragment, ReactNode } from 'react';

import { CategoryAvatar, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { TransactionCategoryBadge } from '@/components/categories/transaction-category-badge';
import { DrawerLink } from '@/components/drawers/drawer-link';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Category } from '@/lib/types/categories.types';
import { Transaction, TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatExchange, formatTime } from '@/lib/utils/formatters';

import { TransactionActions } from './transaction-actions';

/**
 * The category's icon, the name, which opens the merchant's drawer, and the details under it.
 */
export function TransactionSummary({
  transaction,
  extra = [],
}: {
  transaction: Transaction;
  /** More details, after the description */
  extra?: ReactNode[];
}) {
  const name =
    transaction.merchant?.name ||
    transaction.counterpartyName ||
    transaction.description ||
    'No description';

  const details = [
    transaction.description !== name && transaction.description,
    transaction.linkedTransaction && formatExchange(transaction, transaction.linkedTransaction),
    transaction.trip && (
      <DrawerLink
        key="trip"
        to={{ trip: transaction.trip.id }}
        className="inline-flex items-center gap-1 align-bottom hover:underline"
      >
        <PlaneIcon className="size-3" />
        {transaction.trip.name}
      </DrawerLink>
    ),
    ...extra,
  ].filter(Boolean);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <CategoryAvatar
        category={
          transaction.category ??
          (transaction.type === 'exchange'
            ? { icon: 'arrow-left-right', color: UNCATEGORIZED_COLOR }
            : null)
        }
      />
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
        {details.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">
            {details.map((detail, index) => (
              <Fragment key={index}>
                {index > 0 && ' · '}
                {detail}
              </Fragment>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The amount, green for money in, after its value in the main currency when it's another one.
 */
export function TransactionAmount({ transaction }: { transaction: Transaction }) {
  return (
    <p className="flex items-baseline justify-end gap-2 whitespace-nowrap">
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
  );
}

interface TransactionItemProps {
  transaction: TransactionWithAccount;
  /** For changing the category */
  categories: Category[];
  /** A button after the amount */
  action?: ReactNode;
}

export function TransactionItem({ transaction, categories, action }: TransactionItemProps) {
  return (
    <div className="flex items-center gap-3">
      <TransactionSummary
        transaction={transaction}
        extra={[
          <DrawerLink
            key="account"
            to={{ account: transaction.account.id }}
            className="hover:underline"
          >
            {transaction.account.name} ({transaction.subaccount.name})
          </DrawerLink>,
          // Bank dates have no time
          transaction.dataSource === 'manual' && formatTime(transaction.startedDate),
        ]}
      />
      <div className="flex shrink-0 flex-col items-end gap-1">
        <TransactionAmount transaction={transaction} />
        <TransactionCategoryBadge transaction={transaction} />
      </div>
      {action}
      <TransactionActions transaction={transaction} categories={categories}>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/transactions">Details</Link>
        </DropdownMenuItem>
      </TransactionActions>
    </div>
  );
}
