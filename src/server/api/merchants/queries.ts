import 'server-only';

import { subYears } from 'date-fns';
import { and, count, eq, getTableColumns, gte, max, sql } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { Merchant } from '@/lib/types/categories.types';
import { schema } from '@/server/db';

import { categoryColumns } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

/**
 * Returns the merchants of the user with their raw names, transaction counts and the sum of their
 * last 12 months in the main currency.
 */
export const getMerchants = createApiQuery<void, Merchant[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const t = schema.transactions;
  const a = schema.merchantAliases;
  const yearAgo = subYears(new Date(), 1);

  const [merchants, aliasStats, { mapper }] = await Promise.all([
    db.rls((tx) =>
      tx
        .select({ ...getTableColumns(schema.merchants), category: categoryColumns })
        .from(schema.merchants)
        .leftJoin(schema.categories, eq(schema.categories.id, schema.merchants.categoryId)),
    ),
    db.rls((tx) =>
      tx
        .select({
          merchantId: a.merchantId,
          key: a.key,
          currency: schema.subaccounts.currency,
          transactionCount: count(t.id),
          yearTotal:
            sql<number>`coalesce(sum(${t.amount}) filter (where ${gte(t.startedDate, yearAgo)}), 0)`.mapWith(
              Number,
            ),
          lastSeen: max(t.startedDate),
        })
        .from(a)
        .leftJoin(t, and(eq(t.userId, a.userId), eq(t.merchantKey, a.key)))
        .leftJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
        .groupBy(a.merchantId, a.key, schema.subaccounts.currency),
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
        aliases: [],
        transactionCount: 0,
        yearTotal: 0,
        lastSeen: null,
      },
    ]),
  );

  for (const stat of aliasStats) {
    const merchant = result.get(stat.merchantId);
    if (!merchant) {
      continue;
    }

    // A key can have transactions in several currencies, so it can appear more than once
    const alias = merchant.aliases.find((item) => item.key === stat.key);
    if (alias) {
      alias.transactionCount += stat.transactionCount;
    } else {
      merchant.aliases.push({ key: stat.key, transactionCount: stat.transactionCount });
    }
    merchant.transactionCount += stat.transactionCount;

    if (stat.currency) {
      const rate = mapper[stat.currency];
      if (!rate) {
        throw new MissingExchangeRateError(stat.currency);
      }
      merchant.yearTotal += stat.yearTotal * rate;
    }
    if (stat.lastSeen && (!merchant.lastSeen || stat.lastSeen > merchant.lastSeen)) {
      merchant.lastSeen = stat.lastSeen;
    }
  }

  return [...result.values()];
});
