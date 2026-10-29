'use client';

import { cn } from 'cn';
import { EllipsisIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CategoryIcon } from '@/components/categories/category-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sparkline } from '@/components/ui/sparkline';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_KINDS, CategoryKind, CategoryWithStats } from '@/lib/types/categories.types';
import { formatCurrency } from '@/lib/utils/formatters';

import { CategoryDialog } from './category-dialog';
import { DeleteCategoryDialog } from './delete-category-dialog';

interface CategoriesListClientProps {
  categories: CategoryWithStats[];
  mainCurrency: string;
}

export function CategoriesListClient({ categories, mainCurrency }: CategoriesListClientProps) {
  const router = useRouter();
  const [kind, setKind] = useState<CategoryKind | 'all'>('all');
  const [search, setSearch] = useState('');
  // undefined: closed, null: a new category
  const [editing, setEditing] = useState<CategoryWithStats | null>();
  const [deleting, setDeleting] = useState<CategoryWithStats>();

  // Used categories first, the biggest of the last 12 months on top
  const rows = categories
    .filter(
      (category) =>
        (kind === 'all' || category.kind === kind) &&
        category.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .toSorted(
      (a, b) =>
        Number(!b.transactionCount) - Number(!a.transactionCount) ||
        Math.abs(b.yearTotal) - Math.abs(a.yearTotal) ||
        a.name.localeCompare(b.name),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Tabs value={kind} onValueChange={(value) => setKind(value as CategoryKind | 'all')}>
          <TabsList>
            {[{ kind: 'all', shortLabel: 'All' }, ...CATEGORY_KINDS].map((item) => (
              <TabsTrigger key={item.kind} value={item.kind}>
                {item.shortLabel}
                <span className="text-muted-foreground">
                  {item.kind === 'all'
                    ? categories.length
                    : categories.filter((category) => category.kind === item.kind).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-56">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories"
            className="h-8 pl-8"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button icon={PlusIcon} className="sm:ml-auto" onClick={() => setEditing(null)}>
          New category
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Merchants</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
              <TableHead className="text-right">Last 12 months</TableHead>
              <TableHead className="text-right">Trend</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((category) => (
              <TableRow
                key={category.id}
                className={cn(
                  'cursor-pointer',
                  !category.transactionCount && 'text-muted-foreground',
                )}
                onClick={() =>
                  router.push(`/dashboard/categories?category=${category.id}`, { scroll: false })
                }
              >
                <TableCell>
                  <span className="flex items-center gap-2 font-medium">
                    <CategoryIcon category={category} />
                    {category.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CATEGORY_KINDS.find((item) => item.kind === category.kind)?.shortLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{category.merchantCount}</TableCell>
                <TableCell className="text-right">{category.transactionCount}</TableCell>
                <TableCell className="text-right font-medium">
                  {category.kind === 'excluded' ? (
                    <span className="font-normal text-muted-foreground">Not counted</span>
                  ) : (
                    formatCurrency(category.yearTotal, mainCurrency, { maximumFractionDigits: 0 })
                  )}
                </TableCell>
                <TableCell>
                  {category.kind !== 'excluded' && (
                    <div className="flex justify-end">
                      <Sparkline
                        values={category.monthlyTotals}
                        color={category.color}
                        width={60}
                        height={18}
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell className="w-10" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions of ${category.name}`}
                      >
                        <EllipsisIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(category)}>
                        <PencilIcon className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleting(category)}>
                        <Trash2Icon className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No categories.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
}
