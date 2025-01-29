import { eq, relations } from 'drizzle-orm';
import { index, pgPolicy, pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { authenticatedRole, authUsers } from 'drizzle-orm/supabase';

import { authUidDefault, authUid } from '@/server/db/schema/utils';

import { integrationToSubaccounts } from './integration-to-subaccounts.schema';

export const integrations = pgTable(
  'integrations',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    name: text().notNull(),
    externalId: text().notNull(),
    userId: uuid()
      .notNull()
      .default(authUidDefault)
      .references(() => authUsers.id, { onDelete: 'cascade' }),
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
  links: many(integrationToSubaccounts),
}));
