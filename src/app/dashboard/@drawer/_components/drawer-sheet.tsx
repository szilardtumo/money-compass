'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

import { useDrawerHref } from '@/components/drawers/drawer-link';
import { PeriodPicker } from '@/components/period-picker';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Sparkline } from '@/components/ui/sparkline';
import { formatCurrency } from '@/lib/utils/formatters';
import { formatPeriodLabel, parsePeriod } from '@/lib/utils/periods';

/** The tabs of a drawer scroll on their own, under its header */
export const TAB_CONTENT = 'min-h-0 overflow-y-auto px-4 pb-4';

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
      <SheetContent className="w-full gap-0 sm:max-w-xl">
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
          <PeriodPicker period={period} withLastMonths className="justify-between" />
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
