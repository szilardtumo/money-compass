'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Selectbox } from '@/components/ui/selectbox';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category, CATEGORY_KINDS, CategoryKind } from '@/lib/types/categories.types';
import { apiActions } from '@/server/api/actions';

interface CategoryDialogProps {
  open: boolean;
  /** The category to edit, or undefined for a new one */
  category?: Category;
  onClose: () => void;
}

export function CategoryDialog({ open, category, onClose }: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        {open && <CategoryForm key={category?.id} category={category} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ category, onClose }: Omit<CategoryDialogProps, 'open'>) {
  const [name, setName] = useState(category?.name ?? '');
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? 'expense');

  const toasts = {
    loadingToast: 'Saving category...',
    successToast: 'Category saved!',
    errorToast: ({ errorMessage }: { errorMessage: string }) => ({
      title: 'Failed to save the category',
      description: errorMessage,
    }),
    onSuccess: onClose,
  };
  const create = useActionWithToast(apiActions.categories.createCategory, toasts);
  const update = useActionWithToast(apiActions.categories.updateCategory, toasts);
  const isExecuting = create.isExecuting || update.isExecuting;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (category) {
          update.execute({ id: category.id, name, kind });
        } else {
          create.execute({ name, kind });
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category-name">Name</Label>
        <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <Selectbox
          options={CATEGORY_KINDS.map(({ kind, label }) => ({ label, value: kind }))}
          value={kind}
          onValueChange={(value) => value && setKind(value as CategoryKind)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={!name.trim() || isExecuting} isLoading={isExecuting}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
