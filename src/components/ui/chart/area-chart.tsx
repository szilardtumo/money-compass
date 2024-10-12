// Tremor AreaChart [v0.3.1]
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React from 'react';
import {
  Area,
  CartesianGrid,
  Dot,
  Label,
  Line,
  AreaChart as RechartsAreaChart,
  XAxis,
  YAxis,
} from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { CurveType } from 'recharts/types/shape/Curve';
import { AxisDomain } from 'recharts/types/util/types';

import { cn } from '@/lib/cn';

import { ChartContainer } from './chart-container';
import { ChartLegend, ChartLegendContent } from './chart-legend';
import { ChartTooltip, ChartTooltipContent } from './chart-tooltip';
import { BaseChartValueChangeParams } from './chart.types';
import { chartColors, getYAxisDomain, hasOnlyOneValueForKey } from './chart.utils';

interface ActiveDot {
  index?: number;
  dataKey?: string;
}

interface AreaChartValueChangeParams<TPayload> extends BaseChartValueChangeParams<TPayload> {
  eventType: 'dot' | 'category';
  categoryClicked: string;
}

type ChartTooltipProps = React.ComponentProps<typeof ChartTooltip>;

interface AreaChartProps<TPayload> extends React.HTMLAttributes<HTMLDivElement> {
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
  onValueChange?: (value: AreaChartValueChangeParams<TPayload> | null) => void;
  enableLegendSlider?: boolean;
  tickGap?: number;
  connectNulls?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  legendPosition?: 'top' | 'bottom';
  type?: 'default' | 'stacked' | 'percent';
  fill?: 'gradient' | 'solid' | 'none';
  curveType?: CurveType;
  tooltipCallback?: (tooltipCallbackContent: ChartTooltipProps) => void;
  customTooltipContent?: React.ComponentType<ChartTooltipProps>;
}

const AreaChart = <TPayload extends Record<string, unknown>>(props: AreaChartProps<TPayload>) => {
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
    connectNulls = false,
    className,
    onValueChange,
    tickGap = 5,
    xAxisLabel,
    yAxisLabel,
    legendPosition = 'bottom',
    type = 'default',
    fill = 'none',
    tooltipCallback,
    customTooltipContent,
    curveType = 'linear',
    ...other
  } = props;
  const TooltipContent = customTooltipContent ?? ChartTooltipContent;
  const paddingValue = (!showXAxis && !showYAxis) || (startEndOnly && !showYAxis) ? 0 : 20;
  const [activeDot, setActiveDot] = React.useState<ActiveDot | undefined>(undefined);
  const [activeLegend, setActiveLegend] = React.useState<string | undefined>(undefined);

  const yAxisDomain = getYAxisDomain(autoMinValue, minValue, maxValue);
  const hasOnValueChange = !!onValueChange;
  const stacked = type === 'stacked' || type === 'percent';
  const areaId = React.useId();

  const getFillContent = ({
    fillType,
    activeDot,
    activeLegend,
    category,
  }: {
    fillType: AreaChartProps<TPayload>['fill'];
    activeDot: ActiveDot | undefined;
    activeLegend: string | undefined;
    category: string;
  }) => {
    const stopOpacity = activeDot || (activeLegend && activeLegend !== category) ? 0.1 : 0.3;

    switch (fillType) {
      case 'none':
        return <stop stopColor="currentColor" stopOpacity={0} />;
      case 'gradient':
        return (
          <>
            <stop offset="5%" stopColor="currentColor" stopOpacity={stopOpacity} />
            <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
          </>
        );
      case 'solid':
      default:
        return <stop stopColor="currentColor" stopOpacity={stopOpacity} />;
    }
  };

  function valueToPercent(value: number) {
    return `${(value * 100).toFixed(0)}%`;
  }

  function onDotClick(itemData: any, event: React.MouseEvent) {
    event.stopPropagation();

    if (!hasOnValueChange) return;
    if (
      (itemData.index === activeDot?.index && itemData.dataKey === activeDot?.dataKey) ||
      (hasOnlyOneValueForKey(data, itemData.dataKey) &&
        activeLegend &&
        activeLegend === itemData.dataKey)
    ) {
      setActiveLegend(undefined);
      setActiveDot(undefined);
      onValueChange?.(null);
    } else {
      setActiveLegend(itemData.dataKey);
      setActiveDot({
        index: itemData.index,
        dataKey: itemData.dataKey,
      });
      onValueChange?.({
        eventType: 'dot',
        categoryClicked: itemData.dataKey,
        payload: itemData.payload,
      });
    }
  }

  function onCategoryClick(dataKey: string) {
    if (!hasOnValueChange) return;
    if (
      (dataKey === activeLegend && !activeDot) ||
      (hasOnlyOneValueForKey(data, dataKey) && activeDot && activeDot.dataKey === dataKey)
    ) {
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
    setActiveDot(undefined);
  }

  return (
    <ChartContainer className={className} {...other}>
      <RechartsAreaChart
        data={data}
        onClick={
          hasOnValueChange && (activeLegend || activeDot)
            ? () => {
                setActiveDot(undefined);
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
      >
        {showGridLines ? <CartesianGrid horizontal={true} vertical={false} /> : null}
        <XAxis
          padding={{ left: paddingValue, right: paddingValue }}
          hide={!showXAxis}
          dataKey={index}
          interval={startEndOnly ? 'preserveStartEnd' : intervalType}
          tick={{ transform: 'translate(0, 6)' }}
          ticks={
            startEndOnly
              ? [String(data[0][index]), String(data[data.length - 1][index])]
              : undefined
          }
          fill=""
          stroke=""
          className="text-xs"
          tickLine={false}
          axisLine={false}
          minTickGap={tickGap}
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
          type="number"
          domain={yAxisDomain as AxisDomain}
          tick={{ transform: 'translate(-3, 0)' }}
          fill=""
          stroke=""
          className="text-xs"
          tickFormatter={type === 'percent' ? valueToPercent : valueFormatter}
          allowDecimals={allowDecimals}
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
        {categories.map((category, i) => {
          const categoryId = `${areaId}-${category.replace(/[^a-zA-Z0-9]/g, '')}`;
          const color = colors[i % colors.length];
          return (
            <>
              <defs key={category}>
                <linearGradient
                  key={category}
                  color={color}
                  id={categoryId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  {getFillContent({
                    fillType: fill,
                    activeDot: activeDot,
                    activeLegend: activeLegend,
                    category: category,
                  })}
                </linearGradient>
              </defs>
              <Area
                strokeOpacity={activeDot || (activeLegend && activeLegend !== category) ? 0.3 : 1}
                activeDot={(props: any) => {
                  const {
                    cx: cxCoord,
                    cy: cyCoord,
                    stroke,
                    strokeLinecap,
                    strokeLinejoin,
                    strokeWidth,
                  } = props;
                  return (
                    <Dot
                      className={cn(onValueChange ? 'cursor-pointer' : '')}
                      cx={cxCoord}
                      cy={cyCoord}
                      r={5}
                      fill={color}
                      stroke={stroke}
                      strokeLinecap={strokeLinecap}
                      strokeLinejoin={strokeLinejoin}
                      strokeWidth={strokeWidth}
                      onClick={(_, event) => onDotClick(props, event)}
                    />
                  );
                }}
                dot={(props: any) => {
                  const {
                    stroke,
                    strokeLinecap,
                    strokeLinejoin,
                    strokeWidth,
                    cx: cxCoord,
                    cy: cyCoord,
                    index,
                  } = props;

                  if (
                    (hasOnlyOneValueForKey(data, category) &&
                      !(activeDot || (activeLegend && activeLegend !== category))) ||
                    (activeDot?.index === index && activeDot?.dataKey === category)
                  ) {
                    return (
                      <Dot
                        key={index}
                        cx={cxCoord}
                        cy={cyCoord}
                        r={5}
                        fill={color}
                        stroke={stroke}
                        strokeLinecap={strokeLinecap}
                        strokeLinejoin={strokeLinejoin}
                        strokeWidth={strokeWidth}
                        className={cn(onValueChange ? 'cursor-pointer' : '')}
                      />
                    );
                  }
                  return <React.Fragment key={index}></React.Fragment>;
                }}
                key={category}
                name={category}
                type={curveType}
                dataKey={category}
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                connectNulls={connectNulls}
                stackId={stacked ? 'stack' : undefined}
                fill={`url(#${categoryId})`}
              />
            </>
          );
        })}
        {/* hidden lines to increase clickable target area */}
        {onValueChange
          ? categories.map((category) => (
              <Line
                className={cn('cursor-pointer')}
                strokeOpacity={0}
                key={category}
                name={category}
                type={curveType}
                dataKey={category}
                stroke="transparent"
                fill="transparent"
                legendType="none"
                tooltipType="none"
                strokeWidth={12}
                connectNulls={connectNulls}
                onClick={(props: any, event) => {
                  event.stopPropagation();
                  const { name } = props;
                  onCategoryClick(name);
                }}
              />
            ))
          : null}
      </RechartsAreaChart>
    </ChartContainer>
  );
};

AreaChart.displayName = 'AreaChart';

export { AreaChart };
