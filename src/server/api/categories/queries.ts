import 'server-only';

import { asc, count, countDistinct, eq } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { Category, CategoryWithCounts } from '@/lib/types/categories.types';
import { schema } from '@/server/db';

import { categoryColumns, joinCategory } from './joins';

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
 * Returns the categories of the user with the number of merchants and transactions that use them.
 */
export const getCategoriesWithCounts = createApiQuery<void, CategoryWithCounts[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  const [categories, [merchantCounts, transactionCounts]] = await Promise.all([
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
  ]);
  const merchantsBy = new Map(merchantCounts.map((item) => [item.categoryId, item.value]));
  const transactionsBy = new Map(transactionCounts.map((item) => [item.categoryId, item.value]));

  return categories.map((category) => ({
    ...category,
    merchantCount: merchantsBy.get(category.id) ?? 0,
    transactionCount: transactionsBy.get(category.id) ?? 0,
  }));
});
