import React from 'react';
import * as RechartsPrimitive from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { cn } from '@/lib/cn';

import { ChartCategoryIndicator } from './chart-category-indicator';

const ChartTooltip = (props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) => {
  return <RechartsPrimitive.Tooltip wrapperStyle={{ outline: 'none' }} {...props} />;
};
// Needs to be named "Tooltip" to work with the Recharts
ChartTooltip.displayName = 'Tooltip';

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    Omit<React.ComponentProps<'div'>, 'content'> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: 'line' | 'dot' | 'dashed';
      valueFormatter?: (value: ValueType) => string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      color,
      valueFormatter,
    },
    ref,
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const value = label;

      if (!value) {
        return null;
      }

      return (
        <div className={cn('text-sm font-medium tracking-tight mb-1', labelClassName)}>
          {labelFormatter ? labelFormatter(value, payload) : value}
        </div>
      );
    }, [label, labelFormatter, payload, hideLabel, labelClassName]);

    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className,
        )}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item) => {
            const indicatorColor = color || item.payload.fill || item.color;

            return (
              <div
                key={item.dataKey}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center',
                )}
              >
                {!hideIndicator && (
                  <ChartCategoryIndicator indicator={indicator} color={indicatorColor} />
                )}
                <div className={'flex flex-1 gap-3 justify-between leading-none items-center'}>
                  <div className="grid gap-1.5">
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>

                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {item.value !== undefined
                      ? (valueFormatter?.(item.value) ?? item.value?.toLocaleString())
                      : null}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

ChartTooltipContent.displayName = 'ChartTooltipContent';

export { ChartTooltip, ChartTooltipContent };
