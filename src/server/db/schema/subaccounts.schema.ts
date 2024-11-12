import { and, eq, sql } from 'drizzle-orm';
import { pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole, authUid } from 'drizzle-orm/supabase';

import { accounts } from './accounts.shema';
import { currencies } from './currencies.schema';

export const subaccounts = pgTable(
  'subaccounts',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    name: text().notNull().default('Default'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    accountId: uuid()
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    currency: text()
      .notNull()
      .references(() => currencies.id, { onUpdate: 'cascade' }),
  },
  (table) => [
    pgPolicy('subaccounts_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: sql`EXISTS (SELECT 1 FROM ${accounts} WHERE ${and(eq(accounts.id, table.accountId), eq(accounts.userId, authUid))})`,
      withCheck: sql`EXISTS (SELECT 1 FROM ${accounts} WHERE ${and(eq(accounts.id, table.accountId), eq(accounts.userId, authUid))})`,
    }),
  ],
);
