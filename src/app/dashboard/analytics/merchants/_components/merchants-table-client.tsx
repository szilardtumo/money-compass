'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { MergeIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BulkCategoryPicker } from '@/components/categories/bulk-category-picker';
import { UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { CATEGORY_TOASTS } from '@/components/categories/category-picker';
import { MerchantCategoryPicker } from '@/components/categories/merchant-category-picker';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { useNavigate } from '@/components/navigation-progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableFilter,
  DataTableGlobalFilter,
  DataTablePagination,
  DataTableResetFilters,
  DataTableRowSelectionIndicator,
  useDataTable,
  type DataTableFeatures,
} from '@/components/ui/data-table';
import { Sparkline } from '@/components/ui/sparkline';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category, Merchant } from '@/lib/types/categories.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { parsePeriod } from '@/lib/utils/periods';
import { apiActions } from '@/server/api/actions';

import { MergeMerchantsDialog } from './merge-merchants-dialog';

const columnHelper = createColumnHelper<DataTableFeatures, Merchant>();

interface MerchantsTableClientProps {
  merchants: Merchant[];
  categories: Category[];
  mainCurrency: string;
}

export function MerchantsTableClient({
  merchants,
  categories,
  mainCurrency,
}: MerchantsTableClientProps) {
  const navigate = useNavigate();
  const getDrawerHref = useDrawerHref();
  const [mergeOpen, setMergeOpen] = useState(false);

  const { executeAsync: setMerchantsCategory } = useActionWithToast(
    apiActions.merchants.setMerchantCategory,
    CATEGORY_TOASTS,
  );

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          header: 'Merchant',
          cell: ({ row }) => (
            <span className="flex items-center gap-2 font-medium">
              {row.original.name}
              {row.original.keys.length > 1 && (
                <Badge variant="outline">{row.original.keys.length} names</Badge>
              )}
            </span>
          ),
        }),
        columnHelper.accessor((row) => row.category?.id ?? 'uncategorized', {
          id: 'category',
          header: 'Category',
          filterFn: 'arrHas',
          enableSorting: false,
          cell: ({ row }) => (
            <MerchantCategoryPicker merchant={row.original} categories={categories} />
          ),
        }),
        columnHelper.accessor('transactionCount', {
          header: 'Transactions',
          meta: { align: 'right' },
        }),
        // Sorted by size, so the biggest spending and income come first
        columnHelper.accessor((row) => Math.abs(row.yearTotal), {
          id: 'yearTotal',
          header: 'This year',
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
              color={row.original.category?.color ?? UNCATEGORIZED_COLOR}
              width={60}
              height={18}
              highlight={parsePeriod(undefined).month}
            />
          ),
        }),
        columnHelper.accessor('lastSeen', {
          header: 'Last seen',
          cell: ({ getValue }) => {
            const date = getValue();
            return date ? <span className="whitespace-nowrap">{formatDate(date)}</span> : null;
          },
        }),
      ]),
    [categories, mainCurrency],
  );

  const categoryOptions = useMemo(
    () => [
      { label: 'Uncategorized', value: 'uncategorized' },
      ...categories.map((category) => ({ label: category.name, value: category.id })),
    ],
    [categories],
  );

  const table = useDataTable({
    columns,
    getRowId: (row) => row.id,
    data: merchants,
    enablePagination: true,
    enableRowSelection: true,
    enableSorting: true,
    initialSorting: [{ id: 'yearTotal', desc: true }],
    // Starts as a review list while there are merchants to categorize
    initialColumnFilters: merchants.some((merchant) => !merchant.category)
      ? [{ id: 'category', value: ['uncategorized'] }]
      : [],
  });

  const selected = table.getSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <DataTableGlobalFilter table={table} className="sm:w-[200px]" />
        <DataTableFilter
          table={table}
          columnId="category"
          title="Category"
          options={categoryOptions}
        />
        <DataTableResetFilters table={table} />
        <BulkCategoryPicker
          categories={categories}
          selectedCount={selected.length}
          clearLabel="No category"
          onSelect={async (categoryId) => {
            await setMerchantsCategory({
              merchantIds: selected.map((merchant) => merchant.id),
              categoryId,
            });
            table.resetRowSelection();
          }}
        />
        <Button
          variant="outline"
          icon={MergeIcon}
          className="h-8 px-2.5"
          disabled={selected.length < 2}
          onClick={() => setMergeOpen(true)}
        >
          Merge ({selected.length})
        </Button>
      </div>

      <DataTable
        table={table}
        emptyMessage="No merchants."
        enableRowSelection
        onRowClick={(merchant) =>
          navigate(
            // The year of the totals
            getDrawerHref({ merchant: merchant.id, period: String(parsePeriod(undefined).year) }),
          )
        }
      />

      <div className="flex gap-x-4 gap-y-2 flex-col sm:flex-row sm:justify-between">
        <DataTableRowSelectionIndicator table={table} />
        <DataTablePagination table={table} />
      </div>

      <MergeMerchantsDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        merchants={selected}
        onMerged={() => table.resetRowSelection()}
      />
    </div>
  );
}
