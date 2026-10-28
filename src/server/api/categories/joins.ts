import 'server-only';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { PgSelect } from 'drizzle-orm/pg-core';

import { schema } from '@/server/db';

const t = schema.transactions;

// Exchanges, top-ups and corrections move money between the user's accounts or fix a balance
const TYPES_EXCLUDED_BY_DEFAULT = ['exchange', 'topup', 'correction'];

/**
 * Left joins the merchant of a transactions query and the transaction's category: its own, else
 * its merchant's.
 */
export function joinCategory<T extends PgSelect>(query: T) {
  return query
    .leftJoin(
      schema.merchantAliases,
      and(
        eq(schema.merchantAliases.userId, t.userId),
        eq(schema.merchantAliases.key, t.merchantKey),
      ),
    )
    .leftJoin(schema.merchants, eq(schema.merchants.id, schema.merchantAliases.merchantId))
    .leftJoin(
      schema.categories,
      eq(schema.categories.id, sql`coalesce(${t.categoryId}, ${schema.merchants.categoryId})`),
    );
}

/** Whether a transaction of a joinCategory query is left out of analytics */
export const isExcluded = sql<boolean>`coalesce(${schema.categories.kind} = 'excluded', ${inArray(t.type, TYPES_EXCLUDED_BY_DEFAULT)})`;

export const categoryColumns = {
  id: schema.categories.id,
  name: schema.categories.name,
  kind: schema.categories.kind,
  icon: schema.categories.icon,
  color: schema.categories.color,
};
