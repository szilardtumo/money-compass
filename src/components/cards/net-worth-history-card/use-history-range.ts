'use client';

import { useSearchParams } from 'next/navigation';

import { formatDate } from '@/lib/utils/formatters';

export const HISTORY_RANGES = ['6M', '1Y', 'YTD', 'All'] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

/**
 * The range of the net worth history in the URL, which the cards of the net worth page share. It
 * changes the URL without loading the page again.
 */
export function useHistoryRange() {
  const searchParams = useSearchParams();
  const range = HISTORY_RANGES.find((item) => item === searchParams.get('range')) ?? '1Y';
  const setRange = (value: HistoryRange) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', value);
    window.history.replaceState(null, '', `?${params}`);
  };

  return [range, setRange] as const;
}

/**
 * The monthly points of the range. A point is the balance at the end of its month, so the range
 * starts with the one before it.
 */
export function sliceHistory<T>(history: T[], range: HistoryRange) {
  const months = { '6M': 6, '1Y': 12, YTD: new Date().getUTCMonth(), All: Infinity }[range];
  return history.slice(-(months + 2));
}

/** Like "in a year", for the change over the range */
export function getRangeLabel(range: HistoryRange, firstDate: Date | undefined) {
  return {
    '6M': 'in 6 months',
    '1Y': 'in a year',
    YTD: 'this year',
    All: firstDate && `since ${formatDate(firstDate, 'MMMM yyyy')}`,
  }[range];
}
