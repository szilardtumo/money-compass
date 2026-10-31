'use client';

import Link from 'next/link';

import { TransactionCategoryBadge } from '@/components/categories/transaction-category-badge';
import { DrawerLink } from '@/components/drawers/drawer-link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="flex items-start gap-4">
      <Avatar className="hidden sm:flex h-9 w-9 border" />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium line-clamp-2">
          {transaction.merchant ? (
            <DrawerLink to={{ merchant: transaction.merchant.id }} className="hover:underline">
              {name}
            </DrawerLink>
          ) : (
            name
          )}
          {transaction.dataSource === 'integration' && (
            <Badge variant="outline" className="ml-2">
              Bank sync
            </Badge>
          )}
        </p>
        {!!transaction.description && transaction.description !== name && (
          <p className="text-sm line-clamp-2">{transaction.description}</p>
        )}
        {transaction.linkedTransaction && (
          <p className="text-sm">{formatExchange(transaction, transaction.linkedTransaction)}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>
            {formatTime(transaction.startedDate)} •{' '}
            <Link
              href={`/dashboard/accounts/${transaction.account.id}`}
              className="hover:underline"
            >
              {transaction.account.name} ({transaction.subaccount.name})
            </Link>
          </span>
          <TransactionCategoryBadge transaction={transaction} />
        </div>
      </div>
      <div className="ml-auto font-medium whitespace-nowrap">
        {formatCurrency(transaction.amount.originalValue, transaction.originalCurrency)}
      </div>
      <TransactionActions transaction={transaction} categories={categories}>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/transactions">Details</Link>
        </DropdownMenuItem>
      </TransactionActions>
    </div>
  );
}
