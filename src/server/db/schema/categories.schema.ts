import { eq } from 'drizzle-orm';
import { pgPolicy, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { categoryKind } from './enums.schema';
import { authUid, authUidDefault } from './utils';

// New users get the default categories from private.seed_default_categories()
export const categories = pgTable(
  'categories',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    userId: uuid().notNull().default(authUidDefault),
    name: text().notNull(),
    kind: categoryKind().notNull(),
    // A lucide icon name from CATEGORY_ICONS
    icon: text().notNull().default('tag'),
    color: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.name),
    pgPolicy('categories_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: eq(table.userId, authUid),
    }),
  ],
);
