'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

import { useDrawerHref } from '@/components/drawers/drawer-link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Sparkline } from '@/components/ui/sparkline';
import { formatCurrency } from '@/lib/utils/formatters';

interface DrawerSheetProps {
  icon: ReactNode;
  color: string;
  title: string;
  description: ReactNode;
  /** Usually a menu, next to the title */
  actions?: ReactNode;
  /** The last 12 months in the main currency, oldest first */
  monthlyTotals: number[];
  mainCurrency: string;
  children: ReactNode;
}

/**
 * The layout of the category and merchant drawers: the header with the last 12 months, then the
 * content. Closing it removes the drawer from the URL.
 */
export function DrawerSheet({
  icon,
  color,
  title,
  description,
  actions,
  monthlyTotals,
  mainCurrency,
  children,
}: DrawerSheetProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const format = (value: number) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0 });
  const total = monthlyTotals.reduce((sum, value) => sum + value, 0);

  return (
    <Sheet open onOpenChange={() => router.push(getDrawerHref(null), { scroll: false })}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pr-12">
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
          <div className="mt-4 flex items-end gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
              <p className="text-xl font-semibold">{format(total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly average</p>
              <p className="text-xl font-semibold">{format(total / 12)}</p>
            </div>
            <div className="ml-auto">
              <Sparkline values={monthlyTotals} color={color} width={168} height={40} />
            </div>
          </div>
        </SheetHeader>

        {children}
      </SheetContent>
    </Sheet>
  );
}
