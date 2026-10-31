import 'server-only';

import { count, eq, gte, isNotNull, max, sql } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { Merchant } from '@/lib/types/categories.types';
import { getLastMonths, getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { schema } from '@/server/db';

import { categoryColumns } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

/**
 * Returns the merchants of the user that have transactions, with their raw names, transaction
 * counts and the sum of their last 12 months in the main currency.
 */
export const getMerchants = createApiQuery<void, Merchant[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const t = schema.transactions;
  const yearAgo = getPeriodRange(parsePeriod(getLastMonths()[0])).start;

  const [merchants, stats, { mapper }] = await Promise.all([
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
          currency: schema.subaccounts.currency,
          transactionCount: count(t.id),
          yearTotal:
            sql<number>`coalesce(sum(${t.amount}) filter (where ${gte(t.startedDate, yearAgo)}), 0)`.mapWith(
              Number,
            ),
          lastSeen: max(t.startedDate),
        })
        .from(t)
        .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
        .where(isNotNull(t.merchantId))
        .groupBy(t.merchantId, t.merchantKey, schema.subaccounts.currency),
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
        lastSeen: null,
      },
    ]),
  );

  for (const stat of stats) {
    const merchant = result.get(stat.merchantId!);
    if (!merchant) {
      continue;
    }

    // A key can have transactions in several currencies, so it can appear more than once
    const existing = merchant.keys.find((item) => item.key === stat.key);
    if (existing) {
      existing.transactionCount += stat.transactionCount;
    } else {
      merchant.keys.push({ key: stat.key!, transactionCount: stat.transactionCount });
    }
    merchant.transactionCount += stat.transactionCount;

    const rate = mapper[stat.currency];
    if (!rate) {
      throw new MissingExchangeRateError(stat.currency);
    }
    merchant.yearTotal += stat.yearTotal * rate;
    if (!merchant.lastSeen || stat.lastSeen! > merchant.lastSeen) {
      merchant.lastSeen = stat.lastSeen;
    }
  }

  // Deleting or editing transactions can leave a merchant without any
  return [...result.values()].filter((merchant) => merchant.transactionCount);
});
