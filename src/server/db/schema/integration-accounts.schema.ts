import { eq, relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { integrations } from './integrations.schema';
import { subaccounts } from './subaccounts.schema';
import { authUid, authUidDefault } from './utils';

export const integrationAccounts = pgTable(
  'integration_accounts',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    userId: uuid().notNull().default(authUidDefault),
    integrationId: uuid()
      .notNull()
      .references(() => integrations.id, { onDelete: 'cascade' }),
    // Changes with every session, while the identification hash stays the same
    externalId: text().notNull(),
    identificationHash: text().notNull(),
    name: text().notNull(),
    iban: text(),
    currency: text().notNull(),
    subaccountId: uuid()
      .unique()
      .references(() => subaccounts.id, { onDelete: 'set null' }),
    linkedAt: timestamp({ withTimezone: true }),
    lastSyncedAt: timestamp({ withTimezone: true }),
    syncCount: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index().on(table.userId),
    unique().on(table.integrationId, table.identificationHash),
    pgPolicy('integration_accounts_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: eq(table.userId, authUid),
    }),
  ],
);

export const integrationAccountsRelations = relations(integrationAccounts, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationAccounts.integrationId],
    references: [integrations.id],
  }),
}));
