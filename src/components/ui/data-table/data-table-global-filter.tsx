'use client';

import { ReactTable, RowData } from '@tanstack/react-table';
import { cn } from 'cn';

import { Input } from '@/components/ui/input';

import { DataTableFeatures } from './use-data-table';

interface DataTableGlobalFilterProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  className?: string;
}

export function DataTableGlobalFilter<TData extends RowData>({
  table,
  className,
}: DataTableGlobalFilterProps<TData>) {
  return (
    <Input
      placeholder="Search..."
      value={(table.state.globalFilter as string) ?? ''}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      className={cn('h-8', className)}
    />
  );
}
