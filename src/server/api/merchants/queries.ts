import 'server-only';

import { and, count, eq, gte, isNotNull, max, sql, sum } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { Merchant } from '@/lib/types/categories.types';
import { toMainCurrency } from '@/lib/utils/currencies';
import { getLastMonths, getLastMonthsStart } from '@/lib/utils/periods';
import { schema } from '@/server/db';

import { categoryColumns, transactionMonth } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

/**
 * Returns the merchants of the user that have transactions, with their raw names, transaction
 * counts and their totals of the last 12 months in the main currency.
 */
export const getMerchants = createApiQuery<void, Merchant[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const t = schema.transactions;
  const months = getLastMonths();

  const [merchants, stats, monthTotals, { mapper }] = await Promise.all([
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
    db.rls((tx) =>
      tx
        .select({
          merchantId: t.merchantId,
          month: transactionMonth.as('month'),
          currency: schema.subaccounts.currency,
          amount: sum(t.amount).mapWith(Number),
        })
        .from(t)
        .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
        .where(and(isNotNull(t.merchantId), gte(t.startedDate, getLastMonthsStart())))
        .groupBy(t.merchantId, sql`month`, schema.subaccounts.currency),
    ),
    getMainCurrencyWithMapper(),
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

  for (const row of monthTotals) {
    const merchant = result.get(row.merchantId!);
    const amount = toMainCurrency(row, mapper);
    if (merchant) {
      merchant.monthlyTotals[months.indexOf(row.month)] += amount;
      merchant.yearTotal += amount;
    }
  }

  // Deleting or editing transactions can leave a merchant without any
  return [...result.values()].filter((merchant) => merchant.transactionCount);
});
