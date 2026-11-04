import {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowData,
  RowSelectionState,
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
import { Dispatch, SetStateAction, useState } from 'react';

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
  /** Keeps the selection on the same rows when the data reloads in another order */
  getRowId?: TableOptions<DataTableFeatures, TData>['getRowId'];
  enableSorting?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  initialSorting?: SortingState;
  initialColumnFilters?: ColumnFiltersState;
}

export function useDataTable<TData extends RowData>(options: UseDataTableOptions<TData>) {
  const [sorting, setSorting] = useState(options.initialSorting ?? []);
  const [columnFilters, setColumnFilters] = useState(options.initialColumnFilters ?? []);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Only the rows in sight stay selected, so a bulk action never reaches rows on another page or
  // hidden by a filter. Reloaded data, like after a bulk action, starts a new selection too.
  const [data, setData] = useState(options.data);
  if (data !== options.data) {
    setData(options.data);
    setRowSelection({});
  }
  const clearSelectionOnChange =
    <T>(setState: Dispatch<SetStateAction<T>>): OnChangeFn<T> =>
    (updater) => {
      setState(updater);
      setRowSelection({});
    };

  const table = useTable<DataTableFeatures, TData>({
    features: dataTableFeatures,
    data: options.data,
    columns: options.columns,
    getRowId: options.getRowId,
    onSortingChange: clearSelectionOnChange(setSorting),
    onColumnFiltersChange: clearSelectionOnChange(setColumnFilters),
    onGlobalFilterChange: clearSelectionOnChange(setGlobalFilter),
    onPaginationChange: clearSelectionOnChange(setPagination),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
    },
    manualPagination: !options.enablePagination,
    enableSortingRemoval: true,
    enableSorting: options.enableSorting,
    enableRowSelection: options.enableRowSelection,
  });

  return table;
}
