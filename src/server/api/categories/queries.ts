import 'server-only';

import { and, asc, count, countDistinct, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { Category, CategoryMerchant, CategoryWithStats } from '@/lib/types/categories.types';
import { toMainCurrency } from '@/lib/utils/currencies';
import { getChartMonths, getPeriodRange, parsePeriod } from '@/lib/utils/periods';
import { schema } from '@/server/db';

import { categoryColumns, joinCategory } from './joins';
import { getTotals } from '../analytics/queries';
import { getMainCurrencyWithMapper } from '../currencies/queries';

const t = schema.transactions;

/**
 * Returns the categories of the user: spending, then income, then excluded ones.
 */
export const getCategories = createApiQuery<void, Category[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  return db.rls((tx) =>
    tx
      .select(categoryColumns)
      .from(schema.categories)
      .orderBy(asc(schema.categories.kind), asc(schema.categories.name)),
  );
});

/**
 * Returns the categories of the user with the number of merchants and transactions that use them,
 * and their totals of this year's months in the main currency.
 */
export const getCategoriesWithStats = createApiQuery<void, CategoryWithStats[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const year = String(parsePeriod(undefined).year);
  const months = getChartMonths(year);
  const { start, end } = getPeriodRange(parsePeriod(year));

  const [categories, [merchantCounts, transactionCounts], { totals }] = await Promise.all([
    getCategories(),
    db.rls((tx) =>
      Promise.all([
        // Merchants without transactions are hidden on the merchants page too
        tx
          .select({
            categoryId: schema.merchants.categoryId,
            value: countDistinct(schema.merchants.id),
          })
          .from(schema.merchants)
          .innerJoin(t, eq(t.merchantId, schema.merchants.id))
          .groupBy(schema.merchants.categoryId),
        joinCategory(
          tx.select({ categoryId: schema.categories.id, value: count() }).from(t).$dynamic(),
        ).groupBy(schema.categories.id),
      ]),
    ),
    getTotals({ from: start.toISOString(), to: end.toISOString(), bucket: 'month' }),
  ]);
  const merchantsBy = new Map(merchantCounts.map((item) => [item.categoryId, item.value]));
  const transactionsBy = new Map(transactionCounts.map((item) => [item.categoryId, item.value]));
  const monthlyTotalsBy = new Map<string, number[]>();
  for (const row of totals) {
    if (row.category) {
      const monthlyTotals = monthlyTotalsBy.get(row.category.id) ?? months.map(() => 0);
      monthlyTotals[months.indexOf(row.bucket)] += row.amount;
      monthlyTotalsBy.set(row.category.id, monthlyTotals);
    }
  }

  return categories.map((category) => {
    const monthlyTotals = monthlyTotalsBy.get(category.id) ?? months.map(() => 0);
    return {
      ...category,
      merchantCount: merchantsBy.get(category.id) ?? 0,
      transactionCount: transactionsBy.get(category.id) ?? 0,
      yearTotal: monthlyTotals.reduce((total, value) => total + value, 0),
      monthlyTotals,
    };
  });
});

/**
 * Returns the merchants of a category, or without a category for null, that have transactions, with
 * their totals of the period in the main currency, the biggest first.
 *
 * @param input.period Like "2026-10" or "2026"
 * @param input.subaccountIds Only the transactions of these subaccounts, else of all
 */
export const getCategoryMerchants = createApiQuery<
  { categoryId: string | null; period: string; subaccountIds?: string[] },
  CategoryMerchant[]
>(async ({ input: { categoryId, period, subaccountIds } }) => {
  'use cache: private';
  const { db } = await createApiContext();
  const m = schema.merchants;
  const { start, end } = getPeriodRange(parsePeriod(period));
  const inPeriod = and(gte(t.startedDate, start), lt(t.startedDate, end));

  const [rows, { mapper }] = await Promise.all([
    db.rls((tx) =>
      tx
        .select({
          id: m.id,
          name: m.name,
          currency: schema.subaccounts.currency,
          transactionCount: sql<number>`count(*) filter (where ${inPeriod})`.mapWith(Number),
          amount: sql<number>`coalesce(sum(${t.amount}) filter (where ${inPeriod}), 0)`.mapWith(
            Number,
          ),
        })
        .from(m)
        .innerJoin(t, eq(t.merchantId, m.id))
        .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
        .where(
          and(
            categoryId ? eq(m.categoryId, categoryId) : isNull(m.categoryId),
            subaccountIds?.length ? inArray(t.subaccountId, subaccountIds) : undefined,
          ),
        )
        .groupBy(m.id, schema.subaccounts.currency),
    ),
    getMainCurrencyWithMapper(),
  ]);

  // A merchant has a row per currency of its transactions
  const merchants = new Map<string, CategoryMerchant>();
  for (const row of rows) {
    const merchant = merchants.get(row.id) ?? {
      id: row.id,
      name: row.name,
      transactionCount: 0,
      total: 0,
    };
    merchants.set(row.id, merchant);
    merchant.transactionCount += row.transactionCount;
    merchant.total += toMainCurrency(row, mapper);
  }

  return [...merchants.values()].toSorted(
    (a, b) => Math.abs(b.total) - Math.abs(a.total) || a.name.localeCompare(b.name),
  );
});
