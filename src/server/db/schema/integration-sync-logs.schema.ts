import { eq, relations } from 'drizzle-orm';
import { index, integer, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { integrationAccounts } from './integration-accounts.schema';
import { authUid, authUidDefault, numericCasted } from './utils';

export const integrationSyncLogs = pgTable(
  'integration_sync_logs',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    userId: uuid().notNull().default(authUidDefault),
    accountId: uuid()
      .notNull()
      .references(() => integrationAccounts.id, { onDelete: 'cascade' }),
    trigger: text({ enum: ['manual', 'cron'] }).notNull(),
    importedCount: integer().notNull().default(0),
    correctionAmount: numericCasted(),
    error: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index().on(table.accountId, table.createdAt.desc()),
    pgPolicy('integration_sync_logs_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: eq(table.userId, authUid),
    }),
  ],
);

export const integrationSyncLogsRelations = relations(integrationSyncLogs, ({ one }) => ({
  account: one(integrationAccounts, {
    fields: [integrationSyncLogs.accountId],
    references: [integrationAccounts.id],
  }),
}));
