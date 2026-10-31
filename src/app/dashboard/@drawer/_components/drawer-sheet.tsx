'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

import { useDrawerHref } from '@/components/drawers/drawer-link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Sparkline } from '@/components/ui/sparkline';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  formatPeriodLabel,
  formatPeriodParam,
  parsePeriod,
  shiftPeriod,
} from '@/lib/utils/periods';

interface DrawerSheetProps {
  icon: ReactNode;
  color: string;
  title: string;
  description: ReactNode;
  /** Usually a menu, next to the title */
  actions?: ReactNode;
  /** Like "2026-10" or "2026", else the last 12 months */
  period: string | undefined;
  /** The total of the period in the main currency */
  total: number;
  /** The months of the period's year, or the last 12 months, in the main currency */
  monthlyTotals: number[];
  /** Of the months so far */
  average: number;
  mainCurrency: string;
  children: ReactNode;
}

/**
 * The layout of the category and merchant drawers: the header with the period and its totals, then
 * the content. Closing it removes the drawer from the URL.
 */
export function DrawerSheet({
  icon,
  color,
  title,
  description,
  actions,
  period,
  total,
  monthlyTotals,
  average,
  mainCurrency,
  children,
}: DrawerSheetProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const format = (value: number) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0 });
  const selected = parsePeriod(period);
  const isMonth = !!period && selected.unit === 'month';

  return (
    <Sheet open onOpenChange={() => router.push(getDrawerHref(null), { scroll: false })}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="gap-4 pr-12">
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
            >
              {icon}
            </span>
            <div className="mr-auto min-w-0">
              <SheetTitle className="truncate">{title}</SheetTitle>
              <SheetDescription asChild>
                <div>{description}</div>
              </SheetDescription>
            </div>
            {actions}
          </div>
          <DrawerPeriod period={period} />
          <div className="flex items-end gap-6">
            <div>
              <p className="text-xs text-muted-foreground">
                {period ? formatPeriodLabel(selected) : 'Last 12 months'}
              </p>
              <p className="text-xl font-semibold">{format(total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {period ? `Monthly average in ${selected.year}` : 'Monthly average'}
              </p>
              <p className="text-xl font-semibold">{format(average)}</p>
            </div>
            <div className="ml-auto">
              <Sparkline
                values={monthlyTotals}
                color={color}
                width={168}
                height={40}
                // The month in its year, the whole year, or this month of the last 12
                highlight={isMonth ? selected.month : period ? null : undefined}
              />
            </div>
          </div>
        </SheetHeader>

        {children}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Tabs for the last 12 months, a month or a year, with buttons for the previous and next one. The
 * period is a URL param, which the analytics page shares.
 */
function DrawerPeriod({ period }: { period: string | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = parsePeriod(period);
  const now = parsePeriod(undefined);
  const latest = formatPeriodParam(
    selected.unit === 'year' ? { unit: 'year', year: now.year, month: 0 } : now,
  );

  const setPeriod = (value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('period', value);
    } else {
      params.delete('period');
    }
    router.push(`${pathname}?${params}`, { scroll: false });
  };
  const selectUnit = (unit: string) => {
    const year = period ? selected.year : now.year;
    setPeriod(
      unit === 'year'
        ? String(year)
        : unit === 'month'
          ? // A past year's months start from its December
            formatPeriodParam(year < now.year ? { unit: 'month', year, month: 11 } : now)
          : undefined,
    );
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <Tabs value={period ? selected.unit : 'last'} onValueChange={selectUnit}>
        <TabsList>
          <TabsTrigger value="last">12 months</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>
      {period && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            icon={ChevronLeftIcon}
            aria-label="Previous"
            className="size-8"
            onClick={() => setPeriod(formatPeriodParam(shiftPeriod(selected, -1)))}
          />
          <span className="w-28 text-center text-sm font-medium">
            {formatPeriodLabel(selected)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            icon={ChevronRightIcon}
            aria-label="Next"
            className="size-8"
            disabled={period >= latest}
            onClick={() => setPeriod(formatPeriodParam(shiftPeriod(selected, 1)))}
          />
        </div>
      )}
    </div>
  );
}
