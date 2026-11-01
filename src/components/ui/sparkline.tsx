'use client';

import { cn } from 'cn';
import { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SparklineProps {
  values: number[];
  color: string;
  /** For the bars of negative values, else the color */
  negativeColor?: string;
  width: number;
  height: number;
  /** The bar shown stronger, the last one by default, or none for null */
  highlight?: number | null;
  /** Shown when hovering a bar */
  tooltips?: ReactNode[];
  onBarClick?: (index: number) => void;
  /** A size here stretches the bars */
  className?: string;
}

/**
 * Tiny bars of the absolute values of a series, with one bar highlighted.
 */
export function Sparkline({
  values,
  color,
  negativeColor = color,
  width,
  height,
  highlight = values.length - 1,
  tooltips,
  onBarClick,
  className,
}: SparklineProps) {
  const max = Math.max(...values.map(Math.abs)) || 1;
  const step = width / values.length;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden={!tooltips}
      className={cn('shrink-0', className)}
    >
      {values.map((value, index) => {
        const barHeight = Math.max((Math.abs(value) / max) * height, 1);
        const bar = (
          <g
            key={index}
            className={cn('group', onBarClick && 'cursor-pointer')}
            onClick={onBarClick && (() => onBarClick(index))}
          >
            {/* Hovers the whole column, as low bars are hard to hit */}
            {tooltips && <rect x={index * step} width={step} height={height} fill="transparent" />}
            <rect
              x={index * step + 1}
              y={height - barHeight}
              width={Math.max(step - 2, 1)}
              height={barHeight}
              rx={1}
              fill={value < 0 ? negativeColor : color}
              opacity={highlight === null || index === highlight ? 1 : 0.5}
              className={cn(tooltips && 'transition-opacity group-hover:opacity-100')}
            />
          </g>
        );
        return tooltips ? (
          <Tooltip key={index}>
            <TooltipTrigger asChild>{bar}</TooltipTrigger>
            <TooltipContent>{tooltips[index]}</TooltipContent>
          </Tooltip>
        ) : (
          bar
        );
      })}
    </svg>
  );
}
