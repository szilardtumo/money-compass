import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Metric } from '@/components/ui/metric';
import { PriceChangeBadge } from '@/components/ui/price-change-badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { PortfolioSummary } from '@/server/api/investments/overview';

const getChange = (change: number, base: number) => (base ? change / Math.abs(base) : 0);

export function PortfolioMetrics({ summary }: { summary: PortfolioSummary }) {
  const format = (value: number, signed = false) =>
    formatCurrency(value, summary.mainCurrency, signed ? { signDisplay: 'exceptZero' } : {});
  const totalGain = summary.totalValue - summary.netInvested;
  const metrics = [
    { label: 'Total value', value: format(summary.totalValue), caption: 'Cash and holdings' },
    {
      label: 'Net invested',
      value: format(summary.netInvested),
      caption: 'Deposits minus withdrawals',
    },
    {
      label: 'Total gain',
      value: format(totalGain, true),
      change: getChange(totalGain, summary.netInvested),
      caption: 'Total value minus net invested',
    },
    {
      label: 'Unrealized gain',
      value: format(summary.unrealizedGain, true),
      change: getChange(summary.unrealizedGain, summary.holdingsValue - summary.unrealizedGain),
      caption: 'Of the holdings over their average cost',
    },
    {
      label: 'Dividends',
      value: format(summary.dividends),
      caption: 'Last 12 months, after withholding tax',
    },
    {
      label: 'Since previous close',
      value: format(summary.dayChange, true),
      change: getChange(summary.dayChange, summary.holdingsValue - summary.dayChange),
      caption: 'Of the holdings',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Metric>{metric.value}</Metric>
              {metric.change !== undefined && <PriceChangeBadge percent={metric.change} />}
            </div>
            <p className="text-xs text-muted-foreground">{metric.caption}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
