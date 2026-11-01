'use client';

import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryWithStats } from '@/lib/types/categories.types';

import { CategoryDialog } from './category-dialog';
import { DeleteCategoryDialog } from './delete-category-dialog';

interface CategoryActionsProps {
  category: CategoryWithStats;
  /** For choosing where the merchants of a deleted category go */
  categories: CategoryWithStats[];
}

/**
 * The menu of a category, which edits or deletes it.
 */
export function CategoryActions({ category, categories }: CategoryActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            icon={EllipsisVerticalIcon}
            aria-label={`Actions of ${category.name}`}
            className="h-6 w-5 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <PencilIcon className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleting(true)}>
            <Trash2Icon className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryDialog open={isEditing} category={category} onClose={() => setIsEditing(false)} />
      <DeleteCategoryDialog
        category={isDeleting ? category : undefined}
        categories={categories}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
