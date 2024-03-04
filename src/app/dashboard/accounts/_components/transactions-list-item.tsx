import { Avatar } from '@/components/ui/avatar';
import { TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatTime } from '@/lib/utils/formatters';

interface TransactionsListItemProps {
  transaction: TransactionWithAccount;
}

export function TransactionsListItem({ transaction }: TransactionsListItemProps) {
  return (
    <div className="flex items-start">
      <Avatar className="h-9 w-9 border" />
      <div className="ml-4 space-y-1">
        <p className="text-sm font-medium leading-none">
          {transaction.description || 'No description'}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatTime(transaction.startedDate)} • {transaction.account.name}
        </p>
      </div>
      <div className="ml-auto font-medium">
        {formatCurrency(transaction.amount, transaction.account.currency)}
      </div>
    </div>
  );
}
