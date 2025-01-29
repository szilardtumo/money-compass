import { and, eq, relations, sql } from 'drizzle-orm';
import { index, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { accounts } from './accounts.schema';
import { currencies } from './currencies.schema';
import { integrationToSubaccounts } from './integration-to-subaccounts.schema';
import { transactions } from './transactions.schema';
import { authUid } from './utils';

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
    index().on(table.accountId),
    pgPolicy('subaccounts_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: sql`EXISTS (SELECT 1 FROM ${accounts} WHERE ${and(eq(accounts.id, table.accountId), eq(accounts.userId, authUid))})`,
      withCheck: sql`EXISTS (SELECT 1 FROM ${accounts} WHERE ${and(eq(accounts.id, table.accountId), eq(accounts.userId, authUid))})`,
    }),
  ],
);

export const subaccountsRelations = relations(subaccounts, ({ many, one }) => ({
  account: one(accounts, { fields: [subaccounts.accountId], references: [accounts.id] }),
  currency: one(currencies, { fields: [subaccounts.currency], references: [currencies.id] }),
  transactions: many(transactions),
  integrations: one(integrationToSubaccounts),
}));
