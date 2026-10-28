import 'server-only';

import { asc, count, countDistinct } from 'drizzle-orm';

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

  return db.rls(async (tx) => {
    const [categories, merchantCounts, transactionCounts] = await Promise.all([
      tx
        .select(categoryColumns)
        .from(schema.categories)
        .orderBy(asc(schema.categories.kind), asc(schema.categories.name)),
      tx
        .select({ categoryId: schema.merchants.categoryId, value: count() })
        .from(schema.merchants)
        .groupBy(schema.merchants.categoryId),
      joinCategory(
        tx
          .select({ categoryId: schema.categories.id, value: countDistinct(t.id) })
          .from(t)
          .$dynamic(),
      ).groupBy(schema.categories.id),
    ]);
    const merchantsBy = new Map(merchantCounts.map((item) => [item.categoryId, item.value]));
    const transactionsBy = new Map(transactionCounts.map((item) => [item.categoryId, item.value]));

    return categories.map((category) => ({
      ...category,
      merchantCount: merchantsBy.get(category.id) ?? 0,
      transactionCount: transactionsBy.get(category.id) ?? 0,
    }));
  });
});
