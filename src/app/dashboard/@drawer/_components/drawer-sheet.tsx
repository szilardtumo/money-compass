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
import { parsePeriod } from '@/lib/utils/periods';

/** The tabs of a drawer scroll on their own, under its header */
export const TAB_CONTENT = 'min-h-0 overflow-y-auto px-4 pb-4';

interface DrawerSheetProps {
  icon: ReactNode;
  color: string;
  title: string;
  description: ReactNode;
  /** Usually a menu, next to the title */
  actions?: ReactNode;
  /** Like "2026-10" or "2026" */
  period: string;
  /** The figures under the period picker, in the main currency */
  stats: { label: string; value: number }[];
  /** A bar per month of the period's year, in the main currency */
  chart: number[];
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
  stats,
  chart,
  mainCurrency,
  children,
}: DrawerSheetProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const format = (value: number) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0 });
  const selected = parsePeriod(period);

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
          <PeriodPicker period={period} className="justify-between" />
          <div className="flex items-end gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-semibold">{format(stat.value)}</p>
              </div>
            ))}
            <div className="ml-auto">
              <Sparkline
                values={chart}
                color={color}
                width={168}
                height={40}
                // The month in its year, else the whole year
                highlight={selected.unit === 'month' ? selected.month : null}
              />
            </div>
          </div>
        </SheetHeader>

        {children}
      </SheetContent>
    </Sheet>
  );
}
