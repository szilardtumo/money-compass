/**
 * A calendar month ("2026-10") or year ("2026") of the analytics. Bank dates are UTC midnights, so
 * the periods are in UTC.
 */
export interface Period {
  unit: 'month' | 'year';
  year: number;
  /** 0-11, 0 for years */
  month: number;
}

export function parsePeriod(value: string | undefined, now = new Date()): Period {
  const match = value?.match(/^(\d{4})(?:-(0[1-9]|1[0-2]))?$/);
  if (!match) {
    return { unit: 'month', year: now.getUTCFullYear(), month: now.getUTCMonth() };
  }
  return match[2]
    ? { unit: 'month', year: Number(match[1]), month: Number(match[2]) - 1 }
    : { unit: 'year', year: Number(match[1]), month: 0 };
}

export function shiftPeriod(period: Period, count: number): Period {
  if (period.unit === 'year') {
    return { ...period, year: period.year + count };
  }
  const date = new Date(Date.UTC(period.year, period.month + count, 1));
  return { unit: 'month', year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

/** The first moment of the period and of the next one */
export function getPeriodRange(period: Period) {
  const next = shiftPeriod(period, 1);
  return {
    start: new Date(Date.UTC(period.year, period.month, 1)),
    end: new Date(Date.UTC(next.year, next.month, 1)),
  };
}

export function formatPeriodParam(period: Period) {
  return period.unit === 'year'
    ? String(period.year)
    : `${period.year}-${String(period.month + 1).padStart(2, '0')}`;
}

export function formatPeriodLabel(period: Period, format: 'long' | 'short' = 'long') {
  if (period.unit === 'year') {
    return String(period.year);
  }
  return new Intl.DateTimeFormat('en-US', {
    month: format === 'long' ? 'long' : 'short',
    year: format === 'long' ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(period.year, period.month, 1)));
}
