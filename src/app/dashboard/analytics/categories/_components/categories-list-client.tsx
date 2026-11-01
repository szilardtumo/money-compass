'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CategoryActions } from '@/components/categories/category-actions';
import { CategoryIcon } from '@/components/categories/category-badge';
import { CategoryDialog } from '@/components/categories/category-dialog';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableGlobalFilter,
  useDataTable,
  type DataTableFeatures,
} from '@/components/ui/data-table';
import { Sparkline } from '@/components/ui/sparkline';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_KINDS, CategoryWithStats } from '@/lib/types/categories.types';
import { formatCurrency } from '@/lib/utils/formatters';
import { parsePeriod } from '@/lib/utils/periods';

const columnHelper = createColumnHelper<DataTableFeatures, CategoryWithStats>();

interface CategoriesListClientProps {
  categories: CategoryWithStats[];
  mainCurrency: string;
}

export function CategoriesListClient({ categories, mainCurrency }: CategoriesListClientProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const [isCreating, setIsCreating] = useState(false);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          header: 'Category',
          cell: ({ row }) => (
            <span className="flex items-center gap-2 font-medium">
              <CategoryIcon category={row.original} />
              {row.original.name}
            </span>
          ),
        }),
        columnHelper.accessor('kind', {
          header: 'Type',
          filterFn: 'arrHas',
          enableGlobalFilter: false,
          cell: ({ getValue }) => (
            <Badge variant="outline">
              {CATEGORY_KINDS.find((item) => item.kind === getValue())?.shortLabel}
            </Badge>
          ),
        }),
        columnHelper.accessor('merchantCount', {
          header: 'Merchants',
          enableGlobalFilter: false,
          meta: { align: 'right' },
        }),
        columnHelper.accessor('transactionCount', {
          header: 'Transactions',
          enableGlobalFilter: false,
          meta: { align: 'right' },
        }),
        // Sorted by size, so the biggest spending and income come first
        columnHelper.accessor((row) => Math.abs(row.yearTotal), {
          id: 'yearTotal',
          header: 'This year',
          enableGlobalFilter: false,
          meta: { align: 'right' },
          cell: ({ row }) => (
            <span className="font-medium whitespace-nowrap">
              {formatCurrency(row.original.yearTotal, mainCurrency, { maximumFractionDigits: 0 })}
            </span>
          ),
        }),
        columnHelper.display({
          id: 'trend',
          header: 'Trend',
          meta: { align: 'right' },
          cell: ({ row }) => (
            <Sparkline
              values={row.original.monthlyTotals}
              color={row.original.color}
              width={60}
              height={18}
              highlight={parsePeriod(undefined).month}
            />
          ),
        }),
        columnHelper.display({
          id: 'actions',
          cell: ({ row }) => <CategoryActions category={row.original} categories={categories} />,
        }),
      ]),
    [categories, mainCurrency],
  );

  const table = useDataTable({
    columns,
    getRowId: (row) => row.id,
    data: categories,
    enableSorting: true,
    initialSorting: [{ id: 'yearTotal', desc: true }],
  });
  const kindColumn = table.getColumn('kind');
  const kind = (kindColumn?.getFilterValue() as string[] | undefined)?.[0] ?? 'all';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Tabs
          value={kind}
          onValueChange={(value) => kindColumn?.setFilterValue(value === 'all' ? [] : [value])}
        >
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
        <DataTableGlobalFilter table={table} className="sm:w-56" />
        <Button icon={PlusIcon} className="sm:ml-auto" onClick={() => setIsCreating(true)}>
          New category
        </Button>
      </div>

      <DataTable
        table={table}
        emptyMessage="No categories."
        onRowClick={(category) =>
          router.push(
            // The year of the totals
            getDrawerHref({ category: category.id, period: String(parsePeriod(undefined).year) }),
            { scroll: false },
          )
        }
      />

      <CategoryDialog open={isCreating} onClose={() => setIsCreating(false)} />
    </div>
  );
}
