// Tremor DonutChart [v0.0.1]
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useMemo } from 'react';
import { Pie, PieChart as ReChartsDonutChart, Sector } from 'recharts';

import { cn } from '@/lib/cn';

import { ChartContainer } from './chart-container';
import { ChartTooltip, ChartTooltipContent } from './chart-tooltip';
import { BaseChartProps, TooltipProps, ValueChangeProps } from './chart.types';
import { chartColors } from './chart.utils';

const renderInactiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, className, fill } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      className={className}
      fill={fill}
      opacity={0.3}
      style={{ outline: 'none' }}
    />
  );
};

interface DonutChartProps<TPayload>
  extends BaseChartProps<TPayload>,
    TooltipProps,
    ValueChangeProps<TPayload, 'sector'> {
  categories: [BaseChartProps<TPayload>['categories'][number]]; // one-element array
  variant?: 'donut' | 'pie';
  label?: string;
  showLabel?: boolean;
}

const DonutChart = <TPayload extends Record<string, unknown>>({
  data = [],
  index,
  categories: [category],
  colors = chartColors,
  valueFormatter,
  showTooltip = true,
  customTooltipContent,
  onValueChange,
  variant = 'donut',
  label,
  showLabel = false,
  ...other
}: DonutChartProps<TPayload>) => {
  const TooltipContent = customTooltipContent ?? ChartTooltipContent;
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  const isDonut = variant === 'donut';

  const parsedLabelInput = useMemo(() => {
    const defaultLabel = data.reduce((sum, item) => sum + (item[index] as number), 0);

    return label ?? valueFormatter?.(defaultLabel) ?? defaultLabel.toLocaleString();
  }, [data, label, index, valueFormatter]);

  const dataWithColor = useMemo(
    () =>
      data.map((dataPoint, i) => ({
        fill: colors[i % colors.length],
        ...dataPoint,
      })),
    [data, colors],
  );

  const handleShapeClick = (data: any, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onValueChange) return;

    if (activeIndex === index) {
      setActiveIndex(undefined);
      onValueChange(null);
    } else {
      setActiveIndex(index);
      onValueChange({
        eventType: 'sector',
        categoryClicked: data.payload[category],
        payload: data.payload,
      });
    }
  };

  return (
    <ChartContainer {...other}>
      <ReChartsDonutChart
        onClick={
          onValueChange && activeIndex !== undefined
            ? () => {
                setActiveIndex(undefined);
                onValueChange(null);
              }
            : undefined
        }
        margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {showLabel && isDonut && (
          <text
            className="fill-current"
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {parsedLabelInput}
          </text>
        )}
        <Pie
          className={cn('stroke-background ', onValueChange ? 'cursor-pointer' : 'cursor-default')}
          data={dataWithColor}
          cx="50%"
          cy="50%"
          startAngle={90}
          endAngle={-270}
          innerRadius={isDonut ? '75%' : '0%'}
          outerRadius="100%"
          stroke=""
          strokeLinejoin="round"
          dataKey={index}
          nameKey={category}
          onClick={handleShapeClick}
          activeIndex={activeIndex}
          inactiveShape={renderInactiveShape}
          style={{ outline: 'none' }}
        />
        {showTooltip && (
          <ChartTooltip content={<TooltipContent valueFormatter={valueFormatter} />} />
        )}
      </ReChartsDonutChart>
    </ChartContainer>
  );
};

DonutChart.displayName = 'DonutChart';

export { DonutChart };
