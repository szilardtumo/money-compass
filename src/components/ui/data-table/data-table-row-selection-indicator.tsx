'use no memo';

import { Table } from '@tanstack/react-table';

import { cn } from '@/lib/cn';

interface DataTableRowSelectionIndicatorProps<TData> {
  table: Table<TData>;
  className?: string;
}

export function DataTableRowSelectionIndicator<TData>({
  table,
  className,
}: DataTableRowSelectionIndicatorProps<TData>) {
  return (
    <div className={cn('flex items-center text-sm text-muted-foreground', className)}>
      {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length}{' '}
      row(s) selected.
    </div>
  );
}
