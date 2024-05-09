import React from 'react';

import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { cn } from '@/lib/cn';

interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-tremor-default text-tremor-default border bg-tremor-background shadow-tremor-dropdown border-tremor-border dark:bg-dark-tremor-background dark:shadow-dark-tremor-dropdown dark:border-dark-tremor-border',
        className,
      )}
      {...props}
    />
  ),
);
ChartTooltip.displayName = 'ChartTooltip';

const ChartTooltipHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'border-tremor-border border-b px-4 py-2 dark:border-dark-tremor-border',
        className,
      )}
      {...props}
    />
  ),
);
ChartTooltipHeader.displayName = 'ChartTooltipHeader';

const ChartTooltipTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn('font-medium leading-none tracking-tight', className)} {...props}>
    {children}
  </h3>
));
ChartTooltipTitle.displayName = 'ChartTooltipTitle';

const ChartTooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 py-2 space-y-1', className)} {...props} />
  ),
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

interface ChartTooltipRowProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  name: string;
  value: string;
  delta?: number;
}

const ChartTooltipRow = React.forwardRef<HTMLDivElement, ChartTooltipRowProps>(
  ({ color, name, value, delta, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(className, 'flex items-center justify-between space-x-8')}
      {...props}
    >
      <div className="flex items-center space-x-2">
        {!!color && (
          <span
            className={cn(
              'shrink-0 rounded-tremor-full border-2 h-3 w-3 border-tremor-background shadow-tremor-card dark:border-dark-tremor-background dark:shadow-dark-tremor-card',
              `bg-${color}-500`,
            )}
          />
        )}
        <p className="text-right whitespace-nowrap text-tremor-content dark:text-dark-tremor-content">
          {name}
        </p>
      </div>
      <div className="flex gap-1 align-baseline">
        <p className="font-medium tabular-nums text-right whitespace-nowrap text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
          {value}
        </p>
        {typeof delta === 'number' && <PriceChangeBadge percent={delta} />}
      </div>
    </div>
  ),
);
ChartTooltipRow.displayName = 'ChartTooltipRow';

export {
  ChartTooltip,
  ChartTooltipContent,
  ChartTooltipHeader,
  ChartTooltipTitle,
  ChartTooltipRow,
};
