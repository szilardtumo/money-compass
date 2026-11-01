import 'server-only';

import { count, eq, isNotNull, max } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { Merchant } from '@/lib/types/categories.types';
import { getChartMonths, getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { schema } from '@/server/db';

import { getTotals } from '../analytics/queries';
import { categoryColumns } from '../categories/joins';

/**
 * Returns the merchants of the user that have transactions, with their raw names, transaction
 * counts and their totals of this year's months in the main currency. The totals count only the
 * transactions in the merchant's category.
 */
export const getMerchants = createApiQuery<void, Merchant[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const t = schema.transactions;
  const year = String(parsePeriod(undefined).year);
  const months = getChartMonths(year);
  const { start, end } = getPeriodRange(parsePeriod(year));

  const [merchants, stats, { totals }] = await Promise.all([
    db.rls((tx) =>
      tx
        .select({ id: schema.merchants.id, name: schema.merchants.name, category: categoryColumns })
        .from(schema.merchants)
        .leftJoin(schema.categories, eq(schema.categories.id, schema.merchants.categoryId)),
    ),
    db.rls((tx) =>
      tx
        .select({
          merchantId: t.merchantId,
          key: t.merchantKey,
          transactionCount: count(t.id),
          lastSeen: max(t.startedDate),
        })
        .from(t)
        .where(isNotNull(t.merchantId))
        .groupBy(t.merchantId, t.merchantKey),
    ),
    getTotals({ from: start.toISOString(), to: end.toISOString(), bucket: 'month' }),
  ]);

  const result = new Map<string, Merchant>(
    merchants.map((merchant) => [
      merchant.id,
      {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        keys: [],
        transactionCount: 0,
        yearTotal: 0,
        monthlyTotals: months.map(() => 0),
        lastSeen: null,
      },
    ]),
  );

  for (const stat of stats) {
    const merchant = result.get(stat.merchantId!);
    if (!merchant) {
      continue;
    }
    merchant.keys.push({ key: stat.key!, transactionCount: stat.transactionCount });
    merchant.transactionCount += stat.transactionCount;
    if (!merchant.lastSeen || stat.lastSeen! > merchant.lastSeen) {
      merchant.lastSeen = stat.lastSeen;
    }
  }

  for (const row of totals) {
    const merchant = row.merchant && result.get(row.merchant.id);
    // Without the transactions that have a category of their own
    if (merchant && row.category?.id === row.merchant!.category?.id) {
      merchant.monthlyTotals[months.indexOf(row.bucket)] += row.amount;
      merchant.yearTotal += row.amount;
    }
  }

  // Deleting or editing transactions can leave a merchant without any
  return [...result.values()].filter((merchant) => merchant.transactionCount);
});
