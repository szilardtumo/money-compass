import { TimeInterval } from '@/lib/types/time.types';

/**
 * Returns a date in the past based on the given range.
 *
 * @example
 * ```ts
 * // Date is 2022-01-02
 * const date = getDateInPast('1 day');
 * console.log(date); // Date('2022-01-01')
 * ```
 * @param range The range to go back in time
 * @returns
 */
function getDateInPast(range: TimeInterval): Date {
  const dateRangeMultiplier = Number(range.split(' ')[0]);
  const current = new Date();

  if (range.includes('min')) {
    current.setUTCMinutes(current.getUTCMinutes() - dateRangeMultiplier);
  } else if (range.includes('hour')) {
    current.setUTCHours(current.getUTCHours() - dateRangeMultiplier);
  } else if (range.includes('day')) {
    current.setUTCDate(current.getUTCDate() - dateRangeMultiplier);
  } else if (range.includes('week')) {
    current.setUTCDate(current.getUTCDate() - 7 * dateRangeMultiplier);
  } else if (range.includes('month')) {
    current.setUTCMonth(current.getUTCMonth() - dateRangeMultiplier);
  } else if (range.includes('year')) {
    current.setUTCFullYear(current.getUTCFullYear() - dateRangeMultiplier);
  }

  return current;
}

/**
 * Generated dates with in the given range with the given interval between them.
 *
 * @example
 * ```ts
 * // Date is 2022-01-03
 * const buckets = generateTimeBuckets('4 day', '1 day');
 * console.log(buckets); // [Date('2021-1-31'), Date('2022-01-01'), Date('2022-01-02'), Date('2022-01-03')]
 * ```
 * @param dateRange The range of the generated dates
 * @param interval The interval between the generated dates
 * @returns
 */
export function generateTimeBuckets(dateRange: TimeInterval, interval: TimeInterval): Date[] {
  const intervalMultiplier = Number(interval.split(' ')[0]);
  const current = getDateInPast(dateRange);

  if (interval.includes('min')) {
    current.setUTCSeconds(0, 0);
  } else if (interval.includes('hour')) {
    current.setUTCMinutes(0, 0, 0);
  } else if (interval.includes('day')) {
    current.setUTCHours(0, 0, 0, 0);
  } else if (interval.includes('week')) {
    current.setUTCHours(0, 0, 0, 0);
    current.setUTCDate(current.getUTCDate() - current.getUTCDay());
  } else if (interval.includes('month')) {
    current.setUTCHours(0, 0, 0, 0);
    current.setUTCDate(1);
  } else if (interval.includes('year')) {
    current.setUTCHours(0, 0, 0, 0);
    current.setUTCMonth(0, 1);
  }

  const buckets: Date[] = [];
  while (current < new Date()) {
    buckets.push(new Date(current));

    if (interval.includes('min')) {
      current.setUTCMinutes(current.getUTCMinutes() + intervalMultiplier);
    } else if (interval.includes('hour')) {
      current.setUTCHours(current.getUTCHours() + intervalMultiplier);
    } else if (interval.includes('day')) {
      current.setUTCDate(current.getUTCDate() + intervalMultiplier);
    } else if (interval.includes('week')) {
      current.setUTCDate(current.getUTCDate() + 7 * intervalMultiplier);
    } else if (interval.includes('month')) {
      current.setUTCMonth(current.getUTCMonth() + intervalMultiplier);
    } else if (interval.includes('year')) {
      current.setUTCFullYear(current.getUTCFullYear() + intervalMultiplier);
    }
  }

  return buckets;
}
