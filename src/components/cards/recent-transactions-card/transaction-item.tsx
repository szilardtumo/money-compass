import { DotsHorizontalIcon, TrashIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

import { useUpdateTransactionDialog } from '@/components/dialogs/update-transaction-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavLink } from '@/components/ui/nav-link';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { TransactionWithAccount } from '@/lib/types/transactions.types';
import { formatCurrency, formatTime } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

interface TransactionItemProps {
  transaction: TransactionWithAccount;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { openDialog: openUpdateTransactionDialog } = useUpdateTransactionDialog();
  const { execute: deleteTransaction } = useActionWithToast(
    apiActions.transactions.deleteTransaction,
    {
      loadingToast: 'Deleting transaction...',
      successToast: 'Transaction deleted!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to delete transaction',
        description: errorMessage,
      }),
    },
  );

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
          <Button variant="ghost" size="icon" icon={DotsHorizontalIcon}>
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              openUpdateTransactionDialog({
                ...transaction,
                amount: transaction.amount.originalValue,
                currency: transaction.originalCurrency,
                date: transaction.startedDate,
              })
            }
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => deleteTransaction(transaction.id)}>
            Delete
            <DropdownMenuShortcut>
              <TrashIcon />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/transactions">Details</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
