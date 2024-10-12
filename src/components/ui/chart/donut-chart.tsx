// Tremor DonutChart [v0.0.1]
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useMemo } from 'react';
import { Pie, PieChart as ReChartsDonutChart, Sector } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { cn } from '@/lib/cn';

import { ChartContainer } from './chart-container';
import { ChartTooltip, ChartTooltipContent } from './chart-tooltip';
import { BaseChartValueChangeParams } from './chart.types';
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

type DonutChartVariant = 'donut' | 'pie';

interface DonutChartValueChangeParams<TPayload> extends BaseChartValueChangeParams<TPayload> {
  eventType: 'sector';
}

type ChartTooltipProps = React.ComponentProps<typeof ChartTooltip>;

interface DonutChartProps<TPayload extends Record<string, unknown>>
  extends React.HTMLAttributes<HTMLDivElement> {
  data: TPayload[];
  category: keyof TPayload & string;
  value: keyof TPayload & string;
  colors?: string[];
  variant?: DonutChartVariant;
  valueFormatter?: (value: ValueType) => string;
  label?: string;
  showLabel?: boolean;
  showTooltip?: boolean;
  onValueChange?: (value: DonutChartValueChangeParams<TPayload> | null) => void;
  tooltipCallback?: (tooltipCallbackContent: ChartTooltipProps) => void;
  customTooltipContent?: React.ComponentType<ChartTooltipProps>;
}

const DonutChart = <TPayload extends Record<string, unknown>>({
  data = [],
  value,
  category,
  colors = chartColors,
  variant = 'donut',
  valueFormatter,
  label,
  showLabel = false,
  showTooltip = true,
  onValueChange,
  tooltipCallback,
  customTooltipContent,
  ...other
}: DonutChartProps<TPayload>) => {
  const TooltipContent = customTooltipContent ?? ChartTooltipContent;
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  const isDonut = variant === 'donut';

  const parsedLabelInput = useMemo(() => {
    const defaultLabel = data.reduce((sum, item) => sum + (item[value] as number), 0);

    return label ?? valueFormatter?.(defaultLabel) ?? defaultLabel.toLocaleString();
  }, [data, label, value, valueFormatter]);

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
          dataKey={value}
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
