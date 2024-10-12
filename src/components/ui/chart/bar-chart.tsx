// Tremor BarChart [v0.2.1]
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React from 'react';
import { Bar, CartesianGrid, Label, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AxisDomain } from 'recharts/types/util/types';

import { cn } from '@/lib/cn';

import { ChartContainer } from './chart-container';
import { ChartLegend, ChartLegendContent } from './chart-legend';
import { ChartTooltip, ChartTooltipContent } from './chart-tooltip';
import { BaseChartValueChangeParams } from './chart.types';
import { chartColors, getYAxisDomain } from './chart.utils';

//#region Shape

function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1) as Array<keyof T>;
  const keys2 = Object.keys(obj2) as Array<keyof T>;

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

const renderShape = (
  props: any,
  activeBar: any | undefined,
  activeLegend: string | undefined,
  layout: string,
) => {
  const { fillOpacity, name, payload, value } = props;
  let { x, width, y, height } = props;

  if (layout === 'horizontal' && height < 0) {
    y += height;
    height = Math.abs(height); // height must be a positive number
  } else if (layout === 'vertical' && width < 0) {
    x += width;
    width = Math.abs(width); // width must be a positive number
  }

  return (
    <rect
      {...props}
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      opacity={
        activeBar || (activeLegend && activeLegend !== name)
          ? deepEqual(activeBar, { ...payload, value })
            ? fillOpacity
            : 0.3
          : fillOpacity
      }
    />
  );
};

//#region BarChart

interface BarChartValueChangeParams<TPayload> extends BaseChartValueChangeParams<TPayload> {
  eventType: 'category' | 'bar';
}

type ChartTooltipProps = React.ComponentProps<typeof ChartTooltip>;

interface BarChartProps<TPayload> extends React.HTMLAttributes<HTMLDivElement> {
  data: TPayload[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: ValueType) => string;
  startEndOnly?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGridLines?: boolean;
  yAxisWidth?: number;
  intervalType?: 'preserveStartEnd' | 'equidistantPreserveStart';
  showTooltip?: boolean;
  showLegend?: boolean;
  autoMinValue?: boolean;
  minValue?: number;
  maxValue?: number;
  allowDecimals?: boolean;
  onValueChange?: (value: BarChartValueChangeParams<TPayload> | null) => void;
  enableLegendSlider?: boolean;
  tickGap?: number;
  barCategoryGap?: string | number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  layout?: 'vertical' | 'horizontal';
  type?: 'default' | 'stacked' | 'percent';
  legendPosition?: 'top' | 'bottom';
  tooltipCallback?: (tooltipCallbackContent: ChartTooltipProps) => void;
  customTooltipContent?: React.ComponentType<ChartTooltipProps>;
}

const BarChart = <TPayload extends Record<string, unknown>>(props: BarChartProps<TPayload>) => {
  const {
    data = [],
    categories = [],
    index,
    colors = chartColors,
    valueFormatter,
    startEndOnly = false,
    showXAxis = true,
    showYAxis = true,
    showGridLines = true,
    yAxisWidth = 56,
    intervalType = 'equidistantPreserveStart',
    showTooltip = true,
    showLegend = true,
    autoMinValue = false,
    minValue,
    maxValue,
    allowDecimals = true,
    className,
    onValueChange,
    barCategoryGap,
    tickGap = 5,
    xAxisLabel,
    yAxisLabel,
    layout = 'horizontal',
    type = 'default',
    legendPosition = 'bottom',
    tooltipCallback,
    customTooltipContent,
    ...other
  } = props;
  const TooltipContent = customTooltipContent ?? ChartTooltipContent;
  const paddingValue = (!showXAxis && !showYAxis) || (startEndOnly && !showYAxis) ? 0 : 20;
  const [activeLegend, setActiveLegend] = React.useState<string | undefined>(undefined);
  const [activeBar, setActiveBar] = React.useState<any | undefined>(undefined);
  const yAxisDomain = getYAxisDomain(autoMinValue, minValue, maxValue);
  const hasOnValueChange = !!onValueChange;
  const stacked = type === 'stacked' || type === 'percent';

  function valueToPercent(value: number) {
    return `${(value * 100).toFixed(0)}%`;
  }

  function onBarClick(data: any, _: any, event: React.MouseEvent) {
    event.stopPropagation();
    if (!onValueChange) return;
    if (deepEqual(activeBar, { ...data.payload, value: data.value })) {
      setActiveLegend(undefined);
      setActiveBar(undefined);
      onValueChange?.(null);
    } else {
      setActiveLegend(data.tooltipPayload?.[0]?.dataKey);
      setActiveBar({
        ...data.payload,
        value: data.value,
      });
      onValueChange?.({
        eventType: 'bar',
        categoryClicked: data.tooltipPayload?.[0]?.dataKey,
        payload: data.payload,
      });
    }
  }

  function onCategoryClick(dataKey: string) {
    if (!hasOnValueChange) return;
    if (dataKey === activeLegend && !activeBar) {
      setActiveLegend(undefined);
      onValueChange?.(null);
    } else {
      setActiveLegend(dataKey);
      onValueChange?.({
        eventType: 'category',
        categoryClicked: dataKey,
        payload: null,
      });
    }
    setActiveBar(undefined);
  }

  return (
    <ChartContainer className={className} {...other}>
      <RechartsBarChart
        data={data}
        onClick={
          hasOnValueChange && (activeLegend || activeBar)
            ? () => {
                setActiveBar(undefined);
                setActiveLegend(undefined);
                onValueChange?.(null);
              }
            : undefined
        }
        margin={{
          bottom: xAxisLabel ? 30 : undefined,
          left: yAxisLabel ? 20 : undefined,
          right: yAxisLabel ? 5 : undefined,
          top: 5,
        }}
        stackOffset={type === 'percent' ? 'expand' : undefined}
        layout={layout}
        barCategoryGap={barCategoryGap}
      >
        {showGridLines ? (
          <CartesianGrid horizontal={layout !== 'vertical'} vertical={layout === 'vertical'} />
        ) : null}
        <XAxis
          hide={!showXAxis}
          tick={{
            transform: layout !== 'vertical' ? 'translate(0, 6)' : undefined,
          }}
          fill=""
          stroke=""
          className={cn('text-xs', { 'mt-4': layout !== 'vertical' })}
          tickLine={false}
          axisLine={false}
          minTickGap={tickGap}
          {...(layout !== 'vertical'
            ? {
                padding: {
                  left: paddingValue,
                  right: paddingValue,
                },
                dataKey: index,
                interval: startEndOnly ? 'preserveStartEnd' : intervalType,
                ticks: startEndOnly
                  ? [String(data[0][index]), String(data[data.length - 1][index])]
                  : undefined,
              }
            : {
                type: 'number',
                domain: yAxisDomain as AxisDomain,
                tickFormatter: type === 'percent' ? valueToPercent : valueFormatter,
                allowDecimals: allowDecimals,
              })}
        >
          {xAxisLabel && (
            <Label
              position="insideBottom"
              offset={-20}
              className="fill-foreground text-sm font-medium"
            >
              {xAxisLabel}
            </Label>
          )}
        </XAxis>
        <YAxis
          width={yAxisWidth}
          hide={!showYAxis}
          axisLine={false}
          tickLine={false}
          fill=""
          stroke=""
          className="text-xs"
          tick={{
            transform: layout !== 'vertical' ? 'translate(-3, 0)' : 'translate(0, 0)',
          }}
          {...(layout !== 'vertical'
            ? {
                type: 'number',
                domain: yAxisDomain as AxisDomain,
                tickFormatter: type === 'percent' ? valueToPercent : valueFormatter,
                allowDecimals: allowDecimals,
              }
            : {
                dataKey: index,
                ticks: startEndOnly
                  ? [String(data[0][index]), String(data[data.length - 1][index])]
                  : undefined,
                type: 'category',
                interval: 'equidistantPreserveStart',
              })}
        >
          {yAxisLabel && (
            <Label
              position="insideLeft"
              style={{ textAnchor: 'middle' }}
              angle={-90}
              offset={-15}
              className="fill-foreground text-sm font-medium"
            >
              {yAxisLabel}
            </Label>
          )}
        </YAxis>
        {showTooltip && (
          <ChartTooltip content={<TooltipContent valueFormatter={valueFormatter} />} />
        )}
        {showLegend && (
          <ChartLegend
            verticalAlign={legendPosition}
            content={
              <ChartLegendContent onCategoryClick={onCategoryClick} activeLegend={activeLegend} />
            }
          />
        )}
        {categories.map((category, i) => (
          <Bar
            className={cn(onValueChange ? 'cursor-pointer' : '')}
            key={category}
            name={category}
            type="linear"
            dataKey={category}
            stackId={stacked ? 'stack' : undefined}
            fill={colors[i % colors.length]}
            shape={(props: any) => renderShape(props, activeBar, activeLegend, layout)}
            onClick={onBarClick}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
};

BarChart.displayName = 'BarChart';

export { BarChart };
