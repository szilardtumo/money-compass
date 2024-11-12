import { eq } from 'drizzle-orm';
import { pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authUid, authUsers, authenticatedRole } from 'drizzle-orm/supabase';

import { accountCategory } from './enums.schema';

export const accounts = pgTable(
  'accounts',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    name: text().notNull(),
    userId: uuid()
      .notNull()
      .default(authUid)
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    category: accountCategory().notNull(),
  },
  (table) => [
    pgPolicy('accounts_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(authUid, table.id),
      withCheck: eq(authUid, table.id),
    }),
  ],
);
