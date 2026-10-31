'use client';

import { cn } from 'cn';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CategoryActions } from '@/components/categories/category-actions';
import { CategoryIcon } from '@/components/categories/category-badge';
import { CategoryDialog } from '@/components/categories/category-dialog';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface CategoriesListClientProps {
  categories: CategoryWithStats[];
  mainCurrency: string;
}

export function CategoriesListClient({ categories, mainCurrency }: CategoriesListClientProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const [kind, setKind] = useState<CategoryKind | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
        <Button icon={PlusIcon} className="sm:ml-auto" onClick={() => setIsCreating(true)}>
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
                  router.push(getDrawerHref({ category: category.id }), { scroll: false })
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
                  {formatCurrency(category.yearTotal, mainCurrency, { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Sparkline
                      values={category.monthlyTotals}
                      color={category.color}
                      width={60}
                      height={18}
                    />
                  </div>
                </TableCell>
                <TableCell className="w-10" onClick={(event) => event.stopPropagation()}>
                  <CategoryActions category={category} categories={categories} />
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

      <CategoryDialog open={isCreating} onClose={() => setIsCreating(false)} />
    </div>
  );
}
