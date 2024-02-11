import * as React from 'react';

import { cn } from '@/lib/cn';

export interface PlaceholderAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

const PlaceholderArea = React.forwardRef<HTMLDivElement, PlaceholderAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex flex-col h-[450px] shrink-0 items-center justify-center text-center rounded-md border border-dashed',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
PlaceholderArea.displayName = 'PlaceholderArea';

const PlaceholderAreaTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3 className={cn('mt-4 text-lg font-semibold', className)} ref={ref} {...props}>
      {children}
    </h3>
  );
});
PlaceholderAreaTitle.displayName = 'PlaceholderAreaTitle';

const PlaceholderAreaDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p className={cn('mb-4 mt-2 text-sm text-muted-foreground', className)} ref={ref} {...props}>
      {children}
    </p>
  );
});
PlaceholderAreaDescription.displayName = 'PlaceholderAreaDescription';

export { PlaceholderArea, PlaceholderAreaTitle, PlaceholderAreaDescription };
