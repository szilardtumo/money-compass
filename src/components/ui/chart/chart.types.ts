import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { ChartTooltip } from '@/components/ui/chart/chart-tooltip';

export interface BaseChartProps<TPayload> extends React.HTMLAttributes<HTMLDivElement> {
  data: TPayload[];
  index: keyof TPayload & string;
  categories: (keyof TPayload & string)[];
  colors?: string[];
  valueFormatter?: (value: ValueType) => string;
}

export interface AxisProps {
  showXAxis?: boolean;
  showYAxis?: boolean;
  yAxisWidth?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  startEndOnly?: boolean;
  intervalType?: 'preserveStartEnd' | 'equidistantPreserveStart';
  tickGap?: number;
  allowDecimals?: boolean;
  autoMinValue?: boolean;
  minValue?: number;
  maxValue?: number;
}

export interface GridProps {
  showGridLines?: boolean;
}

export interface LegendProps {
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom';
}

type ChartTooltipProps = React.ComponentProps<typeof ChartTooltip>;
export interface TooltipProps {
  showTooltip?: boolean;
  customTooltipContent?: React.ComponentType<ChartTooltipProps>;
}

interface ValueChangeParams<TPayload, TEventType> {
  eventType: TEventType;
  categoryClicked: string;
  payload: TPayload | null;
}

export interface ValueChangeProps<TPayload, TEventType> {
  onValueChange?: (value: ValueChangeParams<TPayload, TEventType> | null) => void;
}
