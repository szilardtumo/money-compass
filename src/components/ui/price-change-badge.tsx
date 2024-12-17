import NumberFlow from '@number-flow/react';
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from '@radix-ui/react-icons';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/cn';

const priceChangeBadgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-secondary hover:bg-secondary/80',
        secondary: '',
      },
      changeType: {
        neutral: 'text-secondary-foreground',
        positive: 'text-emerald-700 dark:text-emerald-500',
        negative: 'text-red-700 dark:text-red-500',
      },
    },
    compoundVariants: [
      {
        variant: 'secondary',
        changeType: 'neutral',
        className: 'bg-secondary hover:bg-secondary/80',
      },
      {
        variant: 'secondary',
        changeType: 'positive',
        className: 'bg-emerald-100 dark:bg-emerald-950',
      },
      {
        variant: 'secondary',
        changeType: 'negative',
        className: 'bg-red-100 dark:bg-red-950',
      },
    ],
    defaultVariants: {
      variant: 'default',
      changeType: 'neutral',
    },
  },
);

export interface PriceChangeBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priceChangeBadgeVariants> {
  percent: number;
}

function PriceChangeBadge({ className, percent, variant, ...props }: PriceChangeBadgeProps) {
  const changeType = percent === 0 ? 'neutral' : percent < 0 ? 'negative' : 'positive';
  const Icon =
    changeType === 'neutral'
      ? ArrowRightIcon
      : changeType === 'negative'
        ? ArrowDownIcon
        : ArrowUpIcon;

  return (
    <div className={cn(priceChangeBadgeVariants({ changeType, variant }), className)} {...props}>
      <Icon className="w-4 h-4 mr-1" />
      <NumberFlow
        value={percent}
        format={{
          style: 'percent',
          signDisplay: 'never',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }}
        continuous
      />
    </div>
  );
}

export { PriceChangeBadge, priceChangeBadgeVariants };
