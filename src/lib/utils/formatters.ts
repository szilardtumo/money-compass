import { format, isThisYear, isToday, isYesterday, parseISO } from 'date-fns';

import { Transaction } from '@/lib/types/transactions.types';

export function formatCurrency(
  value: number,
  currency: string,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    // No "-€0" for -0 or an amount that rounds to 0
    signDisplay: 'negative',
    ...options,
  }).format(value);
}

/**
 * Formats both legs of an exchange, the sold amount first, like "RON 537.01 → €100.00".
 */
export function formatExchange(
  { amount, originalCurrency }: Pick<Transaction, 'amount' | 'originalCurrency'>,
  linkedTransaction: NonNullable<Transaction['linkedTransaction']>,
) {
  return [{ amount: amount.originalValue, currency: originalCurrency }, linkedTransaction]
    .toSorted((a, b) => a.amount - b.amount)
    .map((leg) => formatCurrency(Math.abs(leg.amount), leg.currency))
    .join(' → ');
}

export function getCurrencySymbol(currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(0)
    .replace(/\d/g, '')
    .trim();
}

export function formatPercent(value: number, options: Intl.NumberFormatOptions = {}) {
  return Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 2,
    ...options,
  }).format(Number.isNaN(value) ? 0 : value);
}

export function formatDate(date: string | Date, pattern = 'dd-MM-yyyy') {
  return format(new Date(date), pattern);
}

/** "Today", "Yesterday", or a date like "Fri, 30 Oct", with the year when it isn't this one */
export function formatDay(date: string | Date) {
  return isToday(date)
    ? 'Today'
    : isYesterday(date)
      ? 'Yesterday'
      : formatDate(date, isThisYear(date) ? 'EEE, d MMM' : 'EEE, d MMM yyyy');
}

/** The UTC day of a date, like "2026-09-04", since bank dates are midnights in UTC */
export function formatUtcDay(date: string | Date) {
  return new Date(date).toISOString().slice(0, 10);
}

/** Days like "2026-09-04" as "4 – 7 Sep 2026", "30 Aug – 2 Sep 2026" or "30 Dec 2025 – 2 Jan 2026" */
export function formatDateRange(start: string, end: string) {
  const [from, to] = [parseISO(start), parseISO(end)];
  if (start === end) {
    return format(to, 'd MMM yyyy');
  }
  const fromPattern =
    from.getFullYear() !== to.getFullYear()
      ? 'd MMM yyyy'
      : from.getMonth() !== to.getMonth()
        ? 'd MMM'
        : 'd';
  return `${format(from, fromPattern)} – ${format(to, 'd MMM yyyy')}`;
}

export function formatTime(date: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, pattern = 'dd-MM-yyyy HH:mm') {
  return format(new Date(date), pattern);
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
