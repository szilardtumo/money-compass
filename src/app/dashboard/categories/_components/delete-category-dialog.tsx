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
  const [replacementId, setReplacementId] = useState<string>();
  const { execute, isExecuting } = useActionWithToast(apiActions.categories.deleteCategory, {
    loadingToast: 'Deleting category...',
    successToast: 'Category deleted!',
    errorToast: 'Failed to delete the category. Please try again later.',
    onSuccess: onClose,
  });
  const options = categories
    .filter((item) => item.id !== category?.id)
    .map((item) => ({ label: item.name, value: item.id }));

  return (
    <Dialog open={!!category} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {category?.name}</DialogTitle>
          <DialogDescription>
            Its {category?.merchantCount} merchants, and the transactions set to it directly, move
            to the category you choose.
          </DialogDescription>
        </DialogHeader>
        <Selectbox
          key={category?.id}
          options={options}
          value={undefined}
          onValueChange={setReplacementId}
          placeholder="Move them to..."
        />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={
              !category || !options.some((item) => item.value === replacementId) || isExecuting
            }
            isLoading={isExecuting}
            onClick={() => category && replacementId && execute({ id: category.id, replacementId })}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
