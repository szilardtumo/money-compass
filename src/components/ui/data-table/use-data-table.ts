import {
  ColumnFiltersState,
  RowData,
  SortingState,
  TableOptions,
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrHas,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { useState } from 'react';

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { arrHas: filterFn_arrHas },
  // The sort functions that 'auto' sorting picks from
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime, text: sortFn_text },
  columnMeta: metaHelper<{ align: 'left' | 'center' | 'right' }>(),
});

export type DataTableFeatures = typeof dataTableFeatures;

interface UseDataTableOptions<TData extends RowData> {
  data: TableOptions<DataTableFeatures, TData>['data'];
  columns: TableOptions<DataTableFeatures, TData>['columns'];
  enableSorting?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
}

export function useDataTable<TData extends RowData>(options: UseDataTableOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useTable<DataTableFeatures, TData>({
    features: dataTableFeatures,
    data: options.data,
    columns: options.columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    manualPagination: !options.enablePagination,
    enableSortingRemoval: true,
    enableSorting: options.enableSorting,
    enableRowSelection: options.enableRowSelection,
  });

  return table;
}
