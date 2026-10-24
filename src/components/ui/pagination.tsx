import { cn } from 'cn';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';

// shadcn/ui's pagination, with buttons instead of links for client-side paging
function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

function PaginationPrevious(props: React.ComponentProps<typeof Button>) {
  return (
    <Button aria-label="Go to previous page" variant="ghost" size="icon" {...props}>
      <ChevronLeftIcon />
    </Button>
  );
}

function PaginationNext(props: React.ComponentProps<typeof Button>) {
  return (
    <Button aria-label="Go to next page" variant="ghost" size="icon" {...props}>
      <ChevronRightIcon />
    </Button>
  );
}

export { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious };
