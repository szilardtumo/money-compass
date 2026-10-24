'use client';

import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { ReactTable, RowData } from '@tanstack/react-table';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DataTableFeatures } from './use-data-table';

interface DataTableViewOptionsProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  className?: string;
}

export function DataTableViewOptions<TData extends RowData>({
  table,
  className,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          icon={MixerHorizontalIcon}
          className={cn('h-8', className)}
        >
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-(--radix-popper-anchor-width) min-w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
