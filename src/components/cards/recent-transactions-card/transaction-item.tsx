import { Avatar } from '@/components/ui/avatar';
import { NavLink } from '@/components/ui/nav-link';
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
          <NavLink
            href={`/dashboard/accounts/${transaction.account.id}`}
            className="hover:underline"
          >
            {transaction.account.name} ({transaction.subaccount.name})
          </NavLink>
        </p>
      </div>
      <div className="ml-auto font-medium whitespace-nowrap">
        {formatCurrency(transaction.amount.originalValue, transaction.originalCurrency)}
      </div>
    </div>
  );
}
