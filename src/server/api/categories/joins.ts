import 'server-only';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { PgSelect } from 'drizzle-orm/pg-core';

import { AnalyticsSide } from '@/lib/types/analytics.types';
import { TYPES_WITHOUT_MERCHANT } from '@/lib/utils/merchants';
import { schema } from '@/server/db';

const t = schema.transactions;

/** The join condition of a transaction and the alias that assigns it to a merchant */
export const isAliasOfTransaction = and(
  eq(schema.merchantAliases.userId, t.userId),
  eq(schema.merchantAliases.key, t.merchantKey),
)!;

/**
 * Left joins the merchant of a transactions query and the transaction's category: its own, else
 * its merchant's.
 */
export function joinCategory<T extends PgSelect>(query: T) {
  return query
    .leftJoin(schema.merchantAliases, isAliasOfTransaction)
    .leftJoin(schema.merchants, eq(schema.merchants.id, schema.merchantAliases.merchantId))
    .leftJoin(
      schema.categories,
      eq(schema.categories.id, sql`coalesce(${t.categoryId}, ${schema.merchants.categoryId})`),
    );
}

/**
 * Where a transaction of a joinCategory query counts in analytics. Uncategorized ones count by
 * their direction, except refunds, which lower the spending.
 */
export const analyticsSide = sql<AnalyticsSide | 'excluded'>`case
  when coalesce(${schema.categories.kind} = 'excluded', ${inArray(t.type, TYPES_WITHOUT_MERCHANT)}) then 'excluded'
  when ${schema.categories.kind} = 'income' or (${schema.categories.kind} is null and ${t.amount} > 0 and ${t.type} <> 'refund') then 'income'
  else 'spending' end`;

export const categoryColumns = {
  id: schema.categories.id,
  name: schema.categories.name,
  kind: schema.categories.kind,
  icon: schema.categories.icon,
  color: schema.categories.color,
};
