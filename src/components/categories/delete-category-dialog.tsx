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
import { CategoryWithStats } from '@/lib/types/categories.types';
import { apiActions } from '@/server/api/actions';

interface DeleteCategoryDialogProps {
  category: CategoryWithStats | undefined;
  categories: CategoryWithStats[];
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteCategoryDialog({
  category,
  categories,
  onClose,
  onDeleted,
}: DeleteCategoryDialogProps) {
  return (
    <Dialog open={!!category} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {category && (
          <DeleteCategoryForm
            key={category.id}
            category={category}
            categories={categories}
            onClose={onClose}
            onDeleted={onDeleted}
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
  onDeleted,
}: DeleteCategoryDialogProps & { category: CategoryWithStats }) {
  const [replacementId, setReplacementId] = useState<string>();
  const { execute, isExecuting } = useActionWithToast(apiActions.categories.deleteCategory, {
    loadingToast: 'Deleting category...',
    successToast: 'Category deleted!',
    errorToast: 'Failed to delete the category. Please try again later.',
    onSuccess: () => {
      onClose();
      onDeleted?.();
    },
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
