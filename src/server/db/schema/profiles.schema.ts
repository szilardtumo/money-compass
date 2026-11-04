import { eq, relations } from 'drizzle-orm';
import { date, pgPolicy, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole, authUsers } from 'drizzle-orm/supabase';

import { currencies } from './currencies.schema';
import { authUid, authUidDefault } from './utils';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid()
      .notNull()
      .primaryKey()
      .default(authUidDefault)
      .references(() => authUsers.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    mainCurrency: text()
      .notNull()
      .default('eur')
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'set default' }),
    // The trip suggestions up to this day are dismissed
    tripSuggestionsDismissedUntil: date({ mode: 'string' }),
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

export const profilesRelations = relations(profiles, ({ one }) => ({
  mainCurrency: one(currencies, { fields: [profiles.mainCurrency], references: [currencies.id] }),
}));
