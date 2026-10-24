import { ReactTable, RowData } from '@tanstack/react-table';
import { cn } from 'cn';

import { DataTableFeatures } from './use-data-table';

interface DataTableRowSelectionIndicatorProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  className?: string;
}

export function DataTableRowSelectionIndicator<TData extends RowData>({
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
