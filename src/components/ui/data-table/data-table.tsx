'use client';

import { CaretSortIcon, CaretUpIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Table as TableType, flexRender } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/cn';

interface DataTableProps<TData> {
  table: TableType<TData>;
  emptyMessage?: string;
  enableRowSelection?: boolean;
}

export function DataTable<TData>({
  table,
  emptyMessage = 'No results.',
  enableRowSelection = false,
}: DataTableProps<TData>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {enableRowSelection && (
                <TableHead>
                  <Checkbox
                    checked={
                      table.getIsAllPageRowsSelected() ||
                      (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.columnDef.meta?.align === 'right' && 'text-right [&>*]:ml-auto',
                      header.column.columnDef.meta?.align === 'center' &&
                        'text-center [&>*]:mx-auto',
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Toggle
                        className="flex items-center gap-1 px-3 -mx-3"
                        pressed={!!header.column.getIsSorted()}
                        onPressedChange={() => header.column.toggleSorting()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() ? (
                          <CaretUpIcon
                            className={cn(
                              'transition-transform',
                              header.column.getIsSorted() === 'desc' && 'rotate-180',
                            )}
                          />
                        ) : (
                          <CaretSortIcon />
                        )}
                      </Toggle>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {enableRowSelection && (
                  <TableCell>
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      cell.column.columnDef.meta?.align === 'right' && 'text-right [&>*]:ml-auto',
                      cell.column.columnDef.meta?.align === 'center' && 'text-center [&>*]:mx-auto',
                    )}
                  >
                    {cell.getIsGrouped() ? (
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cell.row.getToggleExpandedHandler()}
                          className="mr-2"
                        >
                          <ChevronRightIcon
                            className={cn(
                              'h-4 w-4 transition-transform',
                              cell.row.getIsExpanded() && 'rotate-90',
                            )}
                          />
                        </Button>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ) : cell.getIsPlaceholder() ? null : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
