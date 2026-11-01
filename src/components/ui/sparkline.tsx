'use client';

import { cn } from 'cn';
import { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SparklineProps {
  values: number[];
  color: string;
  /** Draws negative values downwards in this color, else all values as absolute ones */
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
  negativeColor,
  width,
  height,
  highlight = values.length - 1,
  tooltips,
  onBarClick,
  className,
}: SparklineProps) {
  const points = negativeColor ? values : values.map(Math.abs);
  const top = Math.max(...points, 0);
  const range = top - Math.min(...points, 0) || 1;
  const zeroY = (top / range) * height;
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
      {points.map((value, index) => {
        const barHeight = Math.max((Math.abs(value) / range) * height, 1);
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
              y={value < 0 ? zeroY : zeroY - barHeight}
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
