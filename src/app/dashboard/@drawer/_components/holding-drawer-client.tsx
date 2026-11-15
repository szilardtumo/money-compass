'use client';

import { format, parseISO } from 'date-fns';
import { ChartCandlestickIcon } from 'lucide-react';
import { useId } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';

import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { formatCurrency } from '@/lib/utils/formatters';
import { HoldingDetail } from '@/server/api/investments/overview';

import { DrawerSheet, TAB_CONTENT } from './drawer-sheet';

const COLOR = 'var(--chart-1)';
const MARKERS = [
  { key: 'Buy', color: 'var(--success)' },
  { key: 'Sell', color: 'var(--destructive)' },
] as const;

type PricePoint = { date: string; Price: number | null; Buy: number | null; Sell: number | null };

interface HoldingDrawerClientProps {
  holding: HoldingDetail;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  mainCurrency: string;
}

export function HoldingDrawerClient({
  holding,
  transactions,
  accounts,
  categories,
  mainCurrency,
}: HoldingDrawerClientProps) {
  const lastPrice = holding.prices.at(-1)?.close;
  const details = [
    {
      label: 'Quantity',
      value: holding.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 }),
    },
    {
      label: 'Average cost',
      value:
        holding.averageCost === null ? '–' : formatCurrency(holding.averageCost, holding.currency),
    },
    {
      label: 'Last price',
      value: lastPrice === undefined ? '–' : formatCurrency(lastPrice, holding.priceCurrency),
    },
    { label: 'Dividends received', value: formatCurrency(holding.dividends, mainCurrency) },
  ];

  return (
    <DrawerSheet
      icon={<ChartCandlestickIcon className="size-5" style={{ color: COLOR }} />}
      color={COLOR}
      title={holding.symbol}
      description={
        <span className="flex items-center gap-2">
          <span className="truncate">{[holding.name, ...holding.accountNames].join(' · ')}</span>
          {holding.isUnpriced && <Badge variant="outline">Last IBKR price</Badge>}
        </span>
      }
      stats={[
        { label: 'Market value', value: holding.value },
        { label: 'Unrealized gain', value: holding.unrealizedGain },
        { label: 'Realized gain', value: holding.realizedGain },
      ]}
      mainCurrency={mainCurrency}
    >
      <Tabs defaultValue="overview" className="min-h-0 flex-1">
        <TabsList className="mx-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className={TAB_CONTENT}>
          <PriceChart holding={holding} />
          <dl className="grid grid-cols-2 gap-4 py-4">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="text-xs text-muted-foreground">{detail.label}</dt>
                <dd className="font-semibold">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
        <TabsContent value="transactions" className={TAB_CONTENT}>
          <TransactionDayList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
          />
        </TabsContent>
      </Tabs>
    </DrawerSheet>
  );
}

/** The daily closes with a dot at each buy and sell, at its price */
function PriceChart({ holding }: { holding: HoldingDetail }) {
  const gradientId = useId();
  const points = new Map<string, PricePoint>(
    holding.prices.map(({ date, close }) => [date, { date, Price: close, Buy: null, Sell: null }]),
  );
  for (const trade of holding.trades) {
    const point = points.get(trade.date) ?? {
      date: trade.date,
      Price: null,
      Buy: null,
      Sell: null,
    };
    point[trade.type === 'buy' ? 'Buy' : 'Sell'] = trade.price;
    points.set(trade.date, point);
  }
  const data = [...points.values()].toSorted((a, b) => a.date.localeCompare(b.date));
  const formatPrice = (value: unknown, digits?: number) =>
    formatCurrency(value as number, holding.priceCurrency, { maximumFractionDigits: digits });

  return (
    <ChartContainer className="h-56 py-2">
      <ComposedChart data={data} margin={{ top: 5, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLOR} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(date: string) => format(parseISO(date), 'MMM yyyy')}
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tick={{ transform: 'translate(0, 6)' }}
          className="text-xs"
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(value) => formatPrice(value, 0)}
          tickLine={false}
          axisLine={false}
          width={64}
          className="text-xs"
        />
        <Tooltip
          wrapperStyle={{ outline: 'none' }}
          content={(props) => (
            <ChartTooltipContent
              {...props}
              payload={props.payload?.filter((item) => item.value !== null)}
              labelFormatter={(date) => format(parseISO(String(date)), 'd MMM yyyy')}
              valueFormatter={(value) => formatPrice(value)}
            />
          )}
        />
        <Area
          dataKey="Price"
          stroke={COLOR}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          connectNulls
          isAnimationActive={false}
        />
        {MARKERS.map((marker) => (
          <Line
            key={marker.key}
            dataKey={marker.key}
            stroke={marker.color}
            strokeWidth={0}
            dot={{ r: 4, fill: marker.color, stroke: 'var(--background)', strokeWidth: 1.5 }}
            activeDot={false}
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}
