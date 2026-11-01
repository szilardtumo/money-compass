'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { useHookFormActionWithToast } from '@/hooks/useActionWithToast';
import { Category, CATEGORY_KINDS } from '@/lib/types/categories.types';
import { saveCategorySchema } from '@/lib/validation/categories';
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
  const { form, handleSubmitWithAction } = useHookFormActionWithToast(
    apiActions.categories.saveCategory,
    zodResolver(saveCategorySchema),
    {
      actionProps: {
        loadingToast: 'Saving category...',
        successToast: 'Category saved!',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to save the category',
          description: errorMessage,
        }),
        onSuccess: onClose,
      },
      formProps: {
        defaultValues: category
          ? { id: category.id, name: category.name, kind: category.kind }
          : { name: '', kind: 'expense' },
      },
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
        </DialogHeader>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="kind"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Selectbox
                  options={CATEGORY_KINDS.map(({ kind, label }) => ({ label, value: kind }))}
                  onValueChange={onChange}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            isLoading={form.formState.isSubmitting}
          >
            Save
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
