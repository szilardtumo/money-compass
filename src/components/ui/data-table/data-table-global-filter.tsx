'use client';
'use no memo';

import { Table } from '@tanstack/react-table';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

interface DataTableGlobalFilterProps<TData> {
  table: Table<TData>;
  className?: string;
}

export function DataTableGlobalFilter<TData>({
  table,
  className,
}: DataTableGlobalFilterProps<TData>) {
  return (
    <Input
      placeholder="Search..."
      value={(table.getState().globalFilter as string) ?? ''}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      className={cn('h-8', className)}
    />
  );
}
