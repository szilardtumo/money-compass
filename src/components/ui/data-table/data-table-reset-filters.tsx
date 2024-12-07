'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';

interface DataTableResetFiltersProps<TData> {
  table: Table<TData>;
}

export function DataTableResetFilters<TData>({ table }: DataTableResetFiltersProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  if (!isFiltered) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={Cross2Icon}
      iconPlacement="right"
      onClick={() => table.resetColumnFilters()}
      className="h-8 px-2"
    >
      Reset
    </Button>
  );
}
