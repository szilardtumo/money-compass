import 'server-only';

import { asc, count, countDistinct, eq, gte, isNull, sql, sum } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { Category, CategoryMerchant, CategoryWithStats } from '@/lib/types/categories.types';
import { CurrencyMapper } from '@/lib/types/currencies.types';
import { getLastMonths, getLastMonthsStart } from '@/lib/utils/periods';
import { schema } from '@/server/db';

import { categoryColumns, joinCategory, transactionMonth } from './joins';
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

const toMain = (
  { amount, currency }: { amount: number; currency: string },
  mapper: CurrencyMapper,
) => {
  const rate = mapper[currency];
  if (!rate) {
    throw new MissingExchangeRateError(currency);
  }
  return amount * rate;
};

/**
 * Returns the categories of the user with the number of merchants and transactions that use them,
 * and their totals of the last 12 months in the main currency.
 */
export const getCategoriesWithStats = createApiQuery<void, CategoryWithStats[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const months = getLastMonths();

  const [categories, [merchantCounts, transactionCounts, monthTotals], { mapper }] =
    await Promise.all([
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
          joinCategory(
            tx
              .select({
                categoryId: schema.categories.id,
                month: transactionMonth.as('month'),
                currency: schema.subaccounts.currency,
                amount: sum(t.amount).mapWith(Number),
              })
              .from(t)
              .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
              .$dynamic(),
          )
            .where(gte(t.startedDate, getLastMonthsStart()))
            .groupBy(schema.categories.id, sql`month`, schema.subaccounts.currency),
        ]),
      ),
      getMainCurrencyWithMapper(),
    ]);
  const merchantsBy = new Map(merchantCounts.map((item) => [item.categoryId, item.value]));
  const transactionsBy = new Map(transactionCounts.map((item) => [item.categoryId, item.value]));

  return categories.map((category) => {
    const monthlyTotals = months.map(() => 0);
    for (const row of monthTotals) {
      if (row.categoryId === category.id) {
        monthlyTotals[months.indexOf(row.month)] += toMain(row, mapper);
      }
    }

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
 * their totals of the last 12 months in the main currency, the biggest first.
 */
export const getCategoryMerchants = createApiQuery<
  { categoryId: string | null },
  CategoryMerchant[]
>(async ({ input: { categoryId } }) => {
  'use cache: private';
  const { db } = await createApiContext();
  const m = schema.merchants;
  const inLastYear = gte(t.startedDate, getLastMonthsStart());

  const [rows, { mapper }] = await Promise.all([
    db.rls((tx) =>
      tx
        .select({
          id: m.id,
          name: m.name,
          currency: schema.subaccounts.currency,
          transactionCount: sql<number>`count(*) filter (where ${inLastYear})`.mapWith(Number),
          amount: sql<number>`coalesce(sum(${t.amount}) filter (where ${inLastYear}), 0)`.mapWith(
            Number,
          ),
        })
        .from(m)
        .innerJoin(t, eq(t.merchantId, m.id))
        .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
        .where(categoryId ? eq(m.categoryId, categoryId) : isNull(m.categoryId))
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
    merchant.total += toMain(row, mapper);
  }

  return [...merchants.values()].toSorted(
    (a, b) => Math.abs(b.total) - Math.abs(a.total) || a.name.localeCompare(b.name),
  );
});
