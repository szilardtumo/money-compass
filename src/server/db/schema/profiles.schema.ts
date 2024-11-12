import { eq } from 'drizzle-orm';
import { pgPolicy, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole, authUsers } from 'drizzle-orm/supabase';

import { currencies } from './currencies.schema';
import { authUid } from './utils';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid()
      .notNull()
      .primaryKey()
      .references(() => authUsers.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    mainCurrency: text()
      .notNull()
      .default('eur')
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'set default' }),
  },
  (table) => [
    pgPolicy('profiles_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.id, authUid),
    }),
  ],
);
