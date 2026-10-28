'use client';

import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { CategoryIcon } from '@/components/categories/category-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryKind, CategoryWithCounts } from '@/lib/types/categories.types';

import { CategoryDialog } from './category-dialog';
import { DeleteCategoryDialog } from './delete-category-dialog';

const KINDS: { kind: CategoryKind; title: string; description: string }[] = [
  { kind: 'expense', title: 'Spending', description: 'Counts in the spending of analytics.' },
  { kind: 'income', title: 'Income', description: 'Counts in the income of analytics.' },
  {
    kind: 'excluded',
    title: 'Excluded from analytics',
    description: 'For money that moves between your own accounts, and anything else to leave out.',
  },
];

export function CategoriesListClient({ categories }: { categories: CategoryWithCounts[] }) {
  // undefined: closed, null: a new category
  const [editing, setEditing] = useState<CategoryWithCounts | null>();
  const [deleting, setDeleting] = useState<CategoryWithCounts>();

  return (
    <>
      <div className="flex justify-end">
        <Button icon={PlusIcon} onClick={() => setEditing(null)}>
          New category
        </Button>
      </div>

      {KINDS.map(({ kind, title, description }) => (
        <Card key={kind}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {categories
                .filter((category) => category.kind === kind)
                .map((category) => (
                  <li key={category.id} className="flex items-center gap-3 py-2">
                    <CategoryIcon category={category} />
                    <span className="mr-auto font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.merchantCount} merchants, {category.transactionCount} transactions
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => setEditing(category)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${category.name}`}
                      onClick={() => setDeleting(category)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <CategoryDialog
        open={editing !== undefined}
        category={editing ?? undefined}
        onClose={() => setEditing(undefined)}
      />
      <DeleteCategoryDialog
        category={deleting}
        categories={categories}
        onClose={() => setDeleting(undefined)}
      />
    </>
  );
}
