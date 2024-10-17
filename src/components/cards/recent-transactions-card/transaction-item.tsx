import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

import { useUpdateTransactionDialog } from '@/components/providers/update-transaction-dialog-provider';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavLink } from '@/components/ui/nav-link';
import { TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatTime } from '@/lib/utils/formatters';

interface TransactionItemProps {
  transaction: TransactionWithAccount;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { openDialog: openUpdateTransactionDialog } = useUpdateTransactionDialog();

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              openUpdateTransactionDialog({
                ...transaction,
                amount: transaction.amount.originalValue,
                currency: transaction.originalCurrency,
              })
            }
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/transactions">Details</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
