import { and, eq, relations, sql } from 'drizzle-orm';
import { pgPolicy, pgTable, timestamp, uuid, text, integer } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { integrations } from './integrations.schema';
import { subaccounts } from './subaccounts.schema';
import { authUid } from './utils';

export const integrationLinks = pgTable(
  'integration_links',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    integrationId: uuid()
      .notNull()
      .references(() => integrations.id, { onDelete: 'cascade' }),
    subaccountId: uuid()
      .notNull()
      .unique()
      .references(() => subaccounts.id, { onDelete: 'cascade' }),
    integrationAccountId: text().notNull(),
    lastSyncedAt: timestamp({ withTimezone: true }),
    syncCount: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('integration_links_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: sql`EXISTS (SELECT 1 FROM ${integrations} WHERE ${and(eq(integrations.id, table.integrationId), eq(integrations.userId, authUid))})`,
      withCheck: sql`EXISTS (SELECT 1 FROM ${integrations} WHERE ${and(eq(integrations.id, table.integrationId), eq(integrations.userId, authUid))})`,
    }),
  ],
);

export const integrationLinksRelations = relations(integrationLinks, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationLinks.integrationId],
    references: [integrations.id],
  }),
  subaccount: one(subaccounts, {
    fields: [integrationLinks.subaccountId],
    references: [subaccounts.id],
  }),
}));
