'use client';

import { Button } from '@/components/ui/button';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { apiActions } from '@/server/api/actions';

import { CategoryBadge } from './category-badge';
import { CategoryPicker } from './category-picker';

const toasts = {
  loadingToast: 'Updating category...',
  successToast: 'Category updated!',
  errorToast: 'Failed to update the category. Please try again later.',
};

interface TransactionCategoryPickerProps {
  transaction: Pick<Transaction, 'id' | 'merchant' | 'category' | 'categorySource' | 'excluded'>;
  categories: Category[];
}

/**
 * The category of a transaction, which opens a picker. When the merchant has other transactions,
 * it asks whether the new category is for this transaction only or for the whole merchant.
 */
export function TransactionCategoryPicker({
  transaction,
  categories,
}: TransactionCategoryPickerProps) {
  const { merchant } = transaction;
  const { execute: setTransactionCategory } = useActionWithToast(
    apiActions.transactions.setTransactionCategory,
    toasts,
  );
  const { execute: setMerchantCategory } = useActionWithToast(
    apiActions.merchants.setMerchantCategory,
    toasts,
  );

  const setForTransaction = (categoryId: string | null) =>
    setTransactionCategory({ transactionIds: [transaction.id], categoryId });
  const setForMerchant = (merchantId: string, categoryId: string) =>
    setMerchantCategory({ merchantId, categoryId, transactionId: transaction.id });

  return (
    <CategoryPicker
      categories={categories}
      value={transaction.category?.id ?? null}
      onSelect={(categoryId) =>
        merchant && categoryId
          ? setForMerchant(merchant.id, categoryId)
          : setForTransaction(categoryId)
      }
      clearLabel={
        transaction.categorySource === 'transaction'
          ? merchant
            ? `Use ${merchant.name}'s category`
            : 'Remove category'
          : undefined
      }
      renderConfirm={
        merchant && merchant.transactionCount > 1
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
                  Transactions with their own category keep it.
                </p>
              </div>
            )
          : undefined
      }
    >
      <button type="button" className="cursor-pointer" aria-label="Change category">
        <CategoryBadge
          category={transaction.category}
          excluded={transaction.excluded}
          {...(transaction.categorySource === 'transaction' && {
            className: 'border-foreground/40',
            title: 'Set for this transaction only',
          })}
        />
      </button>
    </CategoryPicker>
  );
}
