'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { MergeIcon, TagIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CategoryBadge } from '@/components/categories/category-badge';
import { CategoryPicker } from '@/components/categories/category-picker';
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
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category, Merchant } from '@/lib/types/categories.types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

import { MerchantDialog } from './merchant-dialog';
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
  const [openMerchantId, setOpenMerchantId] = useState<string>();
  const [mergeOpen, setMergeOpen] = useState(false);

  const { execute: setMerchantCategory, executeAsync: setMerchantsCategory } = useActionWithToast(
    apiActions.merchants.setMerchantCategory,
    {
      loadingToast: 'Updating category...',
      successToast: 'Category updated!',
      errorToast: 'Failed to update the category. Please try again later.',
    },
  );

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          header: 'Merchant',
          cell: ({ row }) => (
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 text-left font-medium hover:underline"
              onClick={() => setOpenMerchantId(row.original.id)}
            >
              {row.original.name}
              {row.original.aliases.length > 1 && (
                <Badge variant="outline">{row.original.aliases.length} names</Badge>
              )}
            </button>
          ),
        }),
        columnHelper.accessor((row) => row.category?.id ?? 'uncategorized', {
          id: 'category',
          header: 'Category',
          filterFn: 'arrHas',
          enableSorting: false,
          cell: ({ row }) => (
            <CategoryPicker
              categories={categories}
              value={row.original.category?.id ?? null}
              onSelect={(categoryId) =>
                setMerchantCategory({ merchantIds: [row.original.id], categoryId })
              }
              clearLabel="No category"
            >
              <button type="button" className="cursor-pointer" aria-label="Change category">
                <CategoryBadge category={row.original.category} />
              </button>
            </CategoryPicker>
          ),
        }),
        columnHelper.accessor('transactionCount', {
          header: 'Transactions',
          meta: { align: 'right' },
        }),
        // Sorted by size, so the biggest spending and income come first
        columnHelper.accessor((row) => Math.abs(row.yearTotal), {
          id: 'yearTotal',
          header: 'Last 12 months',
          meta: { align: 'right' },
          cell: ({ row }) => (
            <span className="whitespace-nowrap">
              {formatCurrency(row.original.yearTotal, mainCurrency)}
            </span>
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
    [categories, mainCurrency, setMerchantCategory],
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
        <CategoryPicker
          categories={categories}
          value={null}
          onSelect={async (categoryId) => {
            await setMerchantsCategory({
              merchantIds: selected.map((merchant) => merchant.id),
              categoryId,
            });
            table.resetRowSelection();
          }}
          clearLabel="No category"
        >
          <Button
            variant="outline"
            icon={TagIcon}
            className="h-8 px-2.5 sm:ml-auto"
            disabled={!selected.length}
          >
            Categorize ({selected.length})
          </Button>
        </CategoryPicker>
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

      <DataTable table={table} emptyMessage="No merchants." enableRowSelection />

      <div className="flex gap-x-4 gap-y-2 flex-col sm:flex-row sm:justify-between">
        <DataTableRowSelectionIndicator table={table} />
        <DataTablePagination table={table} />
      </div>

      <MerchantDialog
        merchant={merchants.find((merchant) => merchant.id === openMerchantId)}
        merchants={merchants}
        categories={categories}
        onClose={() => setOpenMerchantId(undefined)}
      />
      <MergeMerchantsDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        merchants={selected}
        onMerged={() => table.resetRowSelection()}
      />
    </div>
  );
}
