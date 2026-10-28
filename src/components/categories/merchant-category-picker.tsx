'use client';

import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category } from '@/lib/types/categories.types';
import { apiActions } from '@/server/api/actions';

import { CategoryBadge } from './category-badge';
import { CATEGORY_TOASTS, CategoryPicker } from './category-picker';

interface MerchantCategoryPickerProps {
  merchant: { id: string; category: Category | null };
  categories: Category[];
}

/**
 * The category of a merchant, which opens a picker that changes it for all its transactions.
 */
export function MerchantCategoryPicker({ merchant, categories }: MerchantCategoryPickerProps) {
  const { execute } = useActionWithToast(apiActions.merchants.setMerchantCategory, CATEGORY_TOASTS);

  return (
    <CategoryPicker
      categories={categories}
      value={merchant.category?.id ?? null}
      onSelect={(categoryId) => execute({ merchantIds: [merchant.id], categoryId })}
      clearLabel="No category"
    >
      <button type="button" className="cursor-pointer" aria-label="Change category">
        <CategoryBadge category={merchant.category} />
      </button>
    </CategoryPicker>
  );
}
