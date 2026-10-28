'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Selectbox } from '@/components/ui/selectbox';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { CategoryWithCounts } from '@/lib/types/categories.types';
import { apiActions } from '@/server/api/actions';

interface DeleteCategoryDialogProps {
  category: CategoryWithCounts | undefined;
  categories: CategoryWithCounts[];
  onClose: () => void;
}

export function DeleteCategoryDialog({ category, categories, onClose }: DeleteCategoryDialogProps) {
  return (
    <Dialog open={!!category} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {category && (
          <DeleteCategoryForm
            key={category.id}
            category={category}
            categories={categories}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryForm({
  category,
  categories,
  onClose,
}: DeleteCategoryDialogProps & { category: CategoryWithCounts }) {
  const [replacementId, setReplacementId] = useState<string>();
  const { execute, isExecuting } = useActionWithToast(apiActions.categories.deleteCategory, {
    loadingToast: 'Deleting category...',
    successToast: 'Category deleted!',
    errorToast: 'Failed to delete the category. Please try again later.',
    onSuccess: onClose,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete {category.name}</DialogTitle>
        <DialogDescription>
          Its {category.merchantCount} merchants, and the transactions set to it directly, move to
          the category you choose.
        </DialogDescription>
      </DialogHeader>
      <Selectbox
        options={categories
          .filter((item) => item.id !== category.id)
          .map((item) => ({ label: item.name, value: item.id }))}
        value={replacementId}
        onValueChange={setReplacementId}
        placeholder="Move them to..."
      />
      <DialogFooter>
        <Button
          variant="destructive"
          disabled={!replacementId || isExecuting}
          isLoading={isExecuting}
          onClick={() => replacementId && execute({ id: category.id, replacementId })}
        >
          Delete
        </Button>
      </DialogFooter>
    </>
  );
}
