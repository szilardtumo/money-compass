import { eq, relations } from 'drizzle-orm';
import { index, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authUsers, authenticatedRole } from 'drizzle-orm/supabase';

import { accountCategory } from './enums.schema';
import { subaccounts } from './subaccounts.schema';
import { authUid, authUidDefault } from './utils';

export const accounts = pgTable(
  'accounts',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    name: text().notNull(),
    userId: uuid()
      .notNull()
      .default(authUidDefault)
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    category: accountCategory().notNull(),
  },
  (table) => [
    index().on(table.userId),
    pgPolicy('accounts_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: eq(table.userId, authUid),
    }),
  ],
);

export const accountsRelations = relations(accounts, ({ many }) => ({
  subaccounts: many(subaccounts),
}));
