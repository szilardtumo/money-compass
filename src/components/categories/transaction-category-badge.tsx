'use client';

import { DrawerLink } from '@/components/drawers/drawer-link';
import { Transaction } from '@/lib/types/transactions.types';

import { CategoryBadge } from './category-badge';

interface TransactionCategoryBadgeProps {
  transaction: Pick<Transaction, 'category' | 'categorySource' | 'excluded'>;
}

/**
 * The category of a transaction, which opens the category's drawer. Exchanges, top-ups and
 * corrections without a category have none to open.
 */
export function TransactionCategoryBadge({ transaction }: TransactionCategoryBadgeProps) {
  const badge = (
    <CategoryBadge
      category={transaction.category}
      excluded={transaction.excluded}
      {...(transaction.categorySource === 'transaction' && {
        className: 'border-foreground/40',
        title: 'Set for this transaction only',
      })}
    />
  );

  if (!transaction.category && transaction.excluded) {
    return badge;
  }
  return (
    <DrawerLink to={{ category: transaction.category?.id ?? 'uncategorized' }}>{badge}</DrawerLink>
  );
}
