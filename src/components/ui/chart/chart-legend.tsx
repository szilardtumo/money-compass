import { cn } from 'cn';
import React from 'react';
import * as RechartsPrimitive from 'recharts';

import { ChartCategoryIndicator } from './chart-category-indicator';

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> &
    Pick<RechartsPrimitive.DefaultLegendContentProps, 'payload' | 'verticalAlign'> & {
      hideIndicator?: boolean;
      indicator?: 'line' | 'dot' | 'dashed';
      onCategoryClick?: (category: string) => void;
      activeLegend?: string;
    }
>(
  (
    {
      className,
      color,
      payload,
      indicator = 'dot',
      hideIndicator = false,
      verticalAlign = 'bottom',
      onCategoryClick,
      activeLegend,
    },
    ref,
  ) => {
    const items = payload?.filter((item) => item.type !== 'none');

    if (!items?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-x-4 flex-wrap',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className,
        )}
      >
        {items.map((item) => {
          // @ts-expect-error payload type is wrong
          const indicatorColor = color || item.payload?.stroke || item.color;

          return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
              key={item.value}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded px-2 py-1 transition',
                !!onCategoryClick && 'cursor-pointer hover:bg-muted',
                activeLegend && activeLegend !== item.value && 'opacity-40',
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (item.value) onCategoryClick?.(item.value);
              }}
            >
              {!hideIndicator && (
                <ChartCategoryIndicator indicator={indicator} color={indicatorColor} />
              )}
              {item.value}
            </div>
          );
        })}
      </div>
    );
  },
);

ChartLegendContent.displayName = 'ChartLegend';

export { ChartLegend, ChartLegendContent };
