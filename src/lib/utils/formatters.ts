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
