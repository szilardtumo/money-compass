'use client';

import { EllipsisIcon, Trash2Icon } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { TransactionCategoryPicker } from '@/components/categories/transaction-category-picker';
import { useUpdateTransactionDialog } from '@/components/dialogs/update-transaction-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { apiActions } from '@/server/api/actions';

interface TransactionActionsProps {
  transaction: Transaction;
  categories: Category[];
  /** More menu items, after the others */
  children?: ReactNode;
}

/**
 * The menu of a transaction, which edits it, changes its category or deletes it.
 */
export function TransactionActions({ transaction, categories, children }: TransactionActionsProps) {
  const [isPicking, setIsPicking] = useState(false);
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
    <TransactionCategoryPicker
      transaction={transaction}
      categories={categories}
      open={isPicking}
      onOpenChange={setIsPicking}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" icon={EllipsisIcon}>
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          // Focus moves to the category picker instead of back to the menu button
          onCloseAutoFocus={(event) => isPicking && event.preventDefault()}
        >
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
          <DropdownMenuItem onClick={() => setIsPicking(true)}>Change category</DropdownMenuItem>
          <DropdownMenuItem onClick={() => deleteTransaction(transaction.id)}>
            Delete
            <DropdownMenuShortcut>
              <Trash2Icon className="size-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </TransactionCategoryPicker>
  );
}
