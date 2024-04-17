import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatTime } from '@/lib/utils/formatters';

interface TransactionItemProps {
  transaction: TransactionWithAccount;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  return (
    <div className="flex items-start gap-4">
      <Avatar className="hidden sm:flex h-9 w-9 border" />
      <div className="space-y-1">
        <p className="text-sm font-medium line-clamp-2">
          {transaction.description || 'No description'}
        </p>
        <p className="mt-0 text-sm text-muted-foreground">
          {formatTime(transaction.startedDate)} •{' '}
          <Link href={`/dashboard/accounts/${transaction.account.id}`} className="hover:underline">
            {transaction.account.name}
          </Link>
        </p>
      </div>
      <div className="ml-auto font-medium whitespace-nowrap">
        {formatCurrency(transaction.amount, transaction.account.currency)}
      </div>
    </div>
  );
}
