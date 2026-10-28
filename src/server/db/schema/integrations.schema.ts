import { eq, relations } from 'drizzle-orm';
import { index, pgPolicy, pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { authenticatedRole, authUsers } from 'drizzle-orm/supabase';

import { authUidDefault, authUid } from '@/server/db/schema/utils';

import { integrationAccounts } from './integration-accounts.schema';

export const integrations = pgTable(
  'integrations',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .default(authUidDefault)
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    provider: text({ enum: ['enable_banking'] }).notNull(),
    externalId: text().notNull().unique(),
    institutionName: text().notNull(),
    institutionCountry: text().notNull(),
    institutionLogoUrl: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index().on(table.userId),
    pgPolicy('integrations_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: eq(table.userId, authUid),
    }),
  ],
);

export const integrationsRelations = relations(integrations, ({ many }) => ({
  accounts: many(integrationAccounts),
}));
