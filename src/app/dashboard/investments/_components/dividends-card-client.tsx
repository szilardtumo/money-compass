'use client';

import { format, parseISO } from 'date-fns';

import { DrawerLink } from '@/components/drawers/drawer-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/ui/chart';
import { Metric } from '@/components/ui/metric';
import { formatCurrency } from '@/lib/utils/formatters';
import { DividendSummary } from '@/server/api/investments/overview';

interface DividendsCardClientProps {
  dividends: DividendSummary;
  mainCurrency: string;
}

export function DividendsCardClient({ dividends, mainCurrency }: DividendsCardClientProps) {
  const formatAmount = (value: number) => formatCurrency(value, mainCurrency);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dividends</CardTitle>
        <CardDescription>After withholding tax</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Metric>{formatAmount(dividends.total)}</Metric>
          <p className="text-xs text-muted-foreground">Last 12 months</p>
        </div>
        <BarChart
          className="h-48"
          data={dividends.months.map((item) => ({
            month: format(parseISO(`${item.month}-01`), 'MMM yy'),
            Dividends: item.amount,
          }))}
          index="month"
          categories={['Dividends']}
          valueFormatter={(value) =>
            formatCurrency(value as number, mainCurrency, { maximumFractionDigits: 0 })
          }
          yAxisWidth={64}
          showGridLines={false}
          showLegend={false}
        />
        <div>
          <p className="text-xs text-muted-foreground">By security, last 12 months</p>
          <ul className="flex flex-col divide-y">
            {dividends.bySecurity.map(({ security, amount }) => {
              const content = (
                <>
                  <span className="w-14 shrink-0 font-medium">{security?.symbol ?? 'Other'}</span>
                  <span className="mr-auto truncate text-muted-foreground">{security?.name}</span>
                  <span className="font-medium whitespace-nowrap">{formatAmount(amount)}</span>
                </>
              );
              return (
                <li key={security?.id ?? 'other'} className="text-sm">
                  {security ? (
                    <DrawerLink
                      to={{ holding: security.id }}
                      className="flex items-center gap-3 py-2 hover:bg-muted/50"
                    >
                      {content}
                    </DrawerLink>
                  ) : (
                    <div className="flex items-center gap-3 py-2">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
