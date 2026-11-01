'use client';

import { cn } from 'cn';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatPeriodLabel,
  formatPeriodParam,
  parsePeriod,
  shiftPeriod,
} from '@/lib/utils/periods';

interface PeriodPickerProps {
  /** Like "2026-10" or "2026" */
  period: string;
  className?: string;
}

/**
 * Tabs for a month or a year, with buttons for the previous and next one. The period is the URL's
 * period param, which the analytics page and the drawers share.
 */
export function PeriodPicker({ period, className }: PeriodPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = parsePeriod(period);
  const now = parsePeriod(undefined);
  const latest = formatPeriodParam(
    selected.unit === 'year' ? { unit: 'year', year: now.year, month: 0 } : now,
  );

  const setPeriod = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('period', value);
    router.push(`${pathname}?${params}`, { scroll: false });
  };
  const selectUnit = (unit: string) => {
    const { year } = selected;
    setPeriod(
      unit === 'year'
        ? String(year)
        : // A past year's months start from its December
          formatPeriodParam(year < now.year ? { unit: 'month', year, month: 11 } : now),
    );
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Tabs value={selected.unit} onValueChange={selectUnit}>
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          icon={ChevronLeftIcon}
          aria-label="Previous"
          className="size-8"
          onClick={() => setPeriod(formatPeriodParam(shiftPeriod(selected, -1)))}
        />
        <span className="w-28 text-center text-sm font-medium">{formatPeriodLabel(selected)}</span>
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
    </div>
  );
}
