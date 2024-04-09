import {
  ColumnFiltersState,
  SortingState,
  TableOptions,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

interface UseDataTableOptions<TData> {
  data: TableOptions<TData>['data'];
  columns: TableOptions<TData>['columns'];
  enableSorting?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
}

export function useDataTable<TData>(options: UseDataTableOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable<TData>({
    data: options.data,
    columns: options.columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
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
