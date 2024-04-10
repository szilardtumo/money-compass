import React from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';

const PageLayout = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <main ref={ref} className={cn('flex flex-col', className)} {...props} />
  ),
);
PageLayout.displayName = 'PageLayout';

const PageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <>
      <div
        ref={ref}
        className={cn('flex items-center justify-between px-4 h-14 ml-12 sm:ml-0', className)}
        {...props}
      />
      <Separator />
    </>
  ),
);
PageHeader.displayName = 'PageHeader';

const PageHeaderTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h1 ref={ref} className={cn('text-xl font-bold mr-auto', className)} {...props}>
    {children}
  </h1>
));
PageHeaderTitle.displayName = 'PageHeaderTitle';

const PageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('m-4 flex flex-col gap-4', className)} {...props} />
  ),
);
PageContent.displayName = 'PageContent';

export { PageLayout, PageHeader, PageHeaderTitle, PageContent };
