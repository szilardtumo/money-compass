'use client';

import { ReactTable, RowData } from '@tanstack/react-table';
import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { DataTableFeatures } from './use-data-table';

interface DataTableResetFiltersProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
}

export function DataTableResetFilters<TData extends RowData>({
  table,
}: DataTableResetFiltersProps<TData>) {
  const isFiltered = table.state.columnFilters.length > 0;

  if (!isFiltered) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={XIcon}
      iconPlacement="right"
      onClick={() => table.resetColumnFilters()}
      className="h-8 px-2"
    >
      Reset
    </Button>
  );
}
