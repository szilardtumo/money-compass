'use client';

import { EllipsisVerticalIcon, Trash2Icon } from 'lucide-react';
import { ReactNode, useRef, useState } from 'react';

import { CATEGORY_TOASTS, CategoryPicker } from '@/components/categories/category-picker';
import { useAddToTripDialog } from '@/components/dialogs/add-to-trip-dialog';
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
import { formatUtcDay } from '@/lib/utils/formatters';
import { TYPES_WITHOUT_MERCHANT } from '@/lib/utils/merchants';
import { apiActions } from '@/server/api/actions';

interface TransactionActionsProps {
  transaction: Transaction;
  categories: Category[];
  /** More menu items, after the others */
  children?: ReactNode;
}

/**
 * The menu of a transaction, which edits it, changes its category or trip, or deletes it. When the merchant
 * has other transactions, the new category can be for this transaction only or for the whole
 * merchant.
 */
export function TransactionActions({ transaction, categories, children }: TransactionActionsProps) {
  const [isPicking, setIsPicking] = useState(false);
  const pickOnClose = useRef(false);
  const { openDialog: openUpdateTransactionDialog } = useUpdateTransactionDialog();
  const { openDialog: openAddToTripDialog } = useAddToTripDialog();
  const { execute: setTransactionTrip } = useActionWithToast(apiActions.trips.setTransactionTrip, {
    loadingToast: 'Removing from trip...',
    successToast: 'Removed from trip!',
    errorToast: 'Failed to remove from the trip. Please try again later.',
  });
  const { merchant, trip } = transaction;
  const tripCategoryApplies =
    !!trip?.categoryId && !TYPES_WITHOUT_MERCHANT.includes(transaction.type);
  // The trip's category outranks the merchant's, so a new one has to be the transaction's own
  const merchantCategoryApplies = merchant && !tripCategoryApplies;
  const { execute: setTransactionCategory } = useActionWithToast(
    apiActions.transactions.setTransactionCategory,
    CATEGORY_TOASTS,
  );
  const { execute: setMerchantCategory } = useActionWithToast(
    apiActions.merchants.setMerchantCategory,
    CATEGORY_TOASTS,
  );

  const setForTransaction = (categoryId: string | null) =>
    setTransactionCategory({ transactionIds: [transaction.id], categoryId });
  const setForMerchant = (merchantId: string, categoryId: string) =>
    setMerchantCategory({ merchantIds: [merchantId], categoryId, transactionId: transaction.id });
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
    <CategoryPicker
      categories={categories}
      open={isPicking}
      onOpenChange={setIsPicking}
      value={transaction.category?.id ?? null}
      onSelect={(categoryId) =>
        merchantCategoryApplies && categoryId
          ? setForMerchant(merchant.id, categoryId)
          : setForTransaction(categoryId)
      }
      clearLabel={
        transaction.categorySource === 'transaction'
          ? tripCategoryApplies
            ? `Use ${trip!.name}'s category`
            : merchant
              ? `Use ${merchant.name}'s category`
              : 'Remove category'
          : undefined
      }
      renderConfirm={
        merchantCategoryApplies && merchant.transactionCount > 1
          ? (categoryId, close) => (
              <div className="flex flex-col gap-2 p-3">
                <p className="text-sm font-medium">Apply to</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setForTransaction(categoryId);
                    close();
                  }}
                >
                  Only this transaction
                </Button>
                <Button
                  className="h-auto py-2 whitespace-normal"
                  onClick={() => {
                    setForMerchant(merchant.id, categoryId);
                    close();
                  }}
                >
                  All {merchant.transactionCount} from {merchant.name}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Transactions with their own category or their trip&apos;s keep it.
                </p>
              </div>
            )
          : undefined
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            icon={EllipsisVerticalIcon}
            aria-label="Transaction actions"
            className="h-6 w-5 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          // The picker opens once the menu is gone, so the closing menu can't dismiss it
          onCloseAutoFocus={(event) => {
            if (pickOnClose.current) {
              pickOnClose.current = false;
              event.preventDefault();
              setIsPicking(true);
            }
          }}
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
          <DropdownMenuItem onClick={() => (pickOnClose.current = true)}>
            Change category
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const day = formatUtcDay(transaction.startedDate);
              openAddToTripDialog({
                transactionIds: [transaction.id],
                startDate: day,
                endDate: day,
              });
            }}
          >
            {trip ? 'Move to another trip' : 'Add to trip'}
          </DropdownMenuItem>
          {trip && (
            <DropdownMenuItem
              onClick={() => setTransactionTrip({ transactionIds: [transaction.id], tripId: null })}
            >
              Remove from {trip.name}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => deleteTransaction(transaction.id)}>
            Delete
            <DropdownMenuShortcut>
              <Trash2Icon className="size-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </CategoryPicker>
  );
}
