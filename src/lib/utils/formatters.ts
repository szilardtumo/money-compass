import { format } from 'date-fns';

import { Transaction } from '@/lib/types/transactions.types';

export function formatCurrency(
  value: number,
  currency: string,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(Number.isNaN(value) ? 0 : value);
}

export function formatDate(date: string | Date, pattern = 'dd-MM-yyyy') {
  return format(new Date(date), pattern);
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
