import { cn } from 'cn';
import * as React from 'react';

import { Separator } from '@/components/ui/separator';

function PageLayout({ className, ...props }: React.ComponentProps<'main'>) {
  return <main className={cn('flex flex-col', className)} {...props} />;
}

function PageHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <>
      <div className={cn('px-4 h-14 ml-12 sm:ml-0', className)} {...props} />
      <Separator />
    </>
  );
}

function PageHeaderTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h2 className={cn('text-xl font-bold mr-auto', className)} {...props} />;
}

function PageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('m-4 flex flex-col gap-4', className)} {...props} />;
}

export { PageLayout, PageHeader, PageHeaderTitle, PageContent };
