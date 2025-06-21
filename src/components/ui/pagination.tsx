import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  ),
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />,
);
PaginationItem.displayName = 'PaginationItem';

type PaginationButtonProps = { isActive?: boolean } & React.ComponentProps<typeof Button>;

function PaginationButton({ isActive, ...props }: PaginationButtonProps) {
  return (
    <Button
      aria-current={isActive ? 'page' : undefined}
      variant={isActive ? 'outline' : 'ghost'}
      {...props}
    />
  );
}
PaginationButton.displayName = 'PaginationButton';

function PaginationPrevious({ ...props }: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton aria-label="Go to previous page" {...props}>
      <ChevronLeftIcon />
    </PaginationButton>
  );
}
PaginationPrevious.displayName = 'PaginationPrevious';

function PaginationNext({ ...props }: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton aria-label="Go to next page" size="icon" {...props}>
      <ChevronRightIcon />
    </PaginationButton>
  );
}
PaginationNext.displayName = 'PaginationNext';

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <DotsHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationButton as PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
