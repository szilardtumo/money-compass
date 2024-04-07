import { format } from 'date-fns';

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
  }).format(value);
}

export function formatDate(date: string | Date, pattern = 'PPP') {
  return format(new Date(date), pattern);
}

export function formatTime(date: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
    ...options,
  }).format(new Date(date));
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
