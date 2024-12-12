'use no memo';

import { Table } from '@tanstack/react-table';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  className?: string;
}

export function DataTablePagination<TData>({ table, className }: DataTablePaginationProps<TData>) {
  return (
    <div
      className={cn('flex items-center justify-between sm:justify-end gap-4 lg:gap-8', className)}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">Rows per page</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[100px] text-center text-sm font-medium">
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
      </div>
      <Pagination className="w-fit m-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={!table.getCanPreviousPage()}
              onClick={table.previousPage}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext disabled={!table.getCanNextPage()} onClick={table.nextPage} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
