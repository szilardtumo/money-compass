'use client';

import { TagIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Category } from '@/lib/types/categories.types';

import { CategoryPicker } from './category-picker';

interface BulkCategoryPickerProps {
  categories: Category[];
  selectedCount: number;
  clearLabel: string;
  onSelect: (categoryId: string | null) => void;
}

/**
 * The "Categorize (n)" button of a table, for its selected rows.
 */
export function BulkCategoryPicker({
  categories,
  selectedCount,
  clearLabel,
  onSelect,
}: BulkCategoryPickerProps) {
  return (
    <CategoryPicker
      categories={categories}
      value={null}
      onSelect={onSelect}
      clearLabel={clearLabel}
    >
      <Button
        variant="outline"
        icon={TagIcon}
        className="h-8 px-2.5 sm:ml-auto"
        disabled={!selectedCount}
      >
        Categorize ({selectedCount})
      </Button>
    </CategoryPicker>
  );
}
