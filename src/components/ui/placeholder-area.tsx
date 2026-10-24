import { cn } from 'cn';
import * as React from 'react';

function PlaceholderArea({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col h-[450px] shrink-0 items-center justify-center text-center rounded-md border border-dashed',
        className,
      )}
      {...props}
    />
  );
}

function PlaceholderAreaTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return <h3 className={cn('mt-4 text-lg font-semibold', className)} {...props} />;
}

function PlaceholderAreaDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('mb-4 mt-2 text-sm text-muted-foreground', className)} {...props} />;
}

export { PlaceholderArea, PlaceholderAreaTitle, PlaceholderAreaDescription };
