import { and, eq, relations, sql } from 'drizzle-orm';
import { pgPolicy, pgTable, timestamp, uuid, primaryKey, text } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { integrations } from './integrations.schema';
import { subaccounts } from './subaccounts.schema';
import { authUid } from './utils';

export const integrationToSubaccounts = pgTable(
  'integration_to_subaccounts',
  {
    integrationId: uuid()
      .notNull()
      .references(() => integrations.id, { onDelete: 'cascade' }),
    subaccountId: uuid()
      .notNull()
      .unique()
      .references(() => subaccounts.id, { onDelete: 'cascade' }),
    integrationAccountId: text().unique().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.integrationId, table.subaccountId] }),
    pgPolicy('integration_to_subaccounts_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: sql`EXISTS (SELECT 1 FROM ${integrations} WHERE ${and(eq(integrations.id, table.integrationId), eq(integrations.userId, authUid))})`,
      withCheck: sql`EXISTS (SELECT 1 FROM ${integrations} WHERE ${and(eq(integrations.id, table.integrationId), eq(integrations.userId, authUid))})`,
    }),
  ],
);

export const integrationToSubaccountsRelations = relations(integrationToSubaccounts, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationToSubaccounts.integrationId],
    references: [integrations.id],
  }),
  subaccount: one(subaccounts, {
    fields: [integrationToSubaccounts.subaccountId],
    references: [subaccounts.id],
  }),
}));
