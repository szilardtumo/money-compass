import { eq, sql } from 'drizzle-orm';
import {
  index,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { categories } from './categories.schema';
import { authUid, authUidDefault } from './utils';

export const merchants = pgTable(
  'merchants',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    userId: uuid().notNull().default(authUidDefault),
    name: text().notNull(),
    categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
    // Set once the LLM or the user handled the merchant. The LLM only looks at merchants without it.
    autoCheckedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Names that differ only in case belong to the same merchant
    uniqueIndex('merchants_user_id_lower_name_index').on(table.userId, sql`lower(${table.name})`),
    index().on(table.categoryId),
    pgPolicy('merchants_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: sql`${eq(table.userId, authUid)} AND (${table.categoryId} IS NULL OR EXISTS (SELECT 1 FROM ${categories} WHERE ${categories.id} = ${table.categoryId} AND ${categories.userId} = ${authUid}))`,
    }),
  ],
);

/**
 * The normalized raw names (see getMerchantKey) that belong to a merchant. A transaction belongs to
 * the merchant of its merchant_key, so merging or splitting merchants only moves aliases.
 */
export const merchantAliases = pgTable(
  'merchant_aliases',
  {
    userId: uuid().notNull().default(authUidDefault),
    key: text().notNull(),
    merchantId: uuid()
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.key] }),
    index().on(table.merchantId),
    pgPolicy('merchant_aliases_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: sql`${eq(table.userId, authUid)} AND EXISTS (SELECT 1 FROM ${merchants} WHERE ${merchants.id} = ${table.merchantId} AND ${merchants.userId} = ${authUid})`,
    }),
  ],
);
