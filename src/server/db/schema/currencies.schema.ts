import { eq, sql } from 'drizzle-orm';
import { check, pgPolicy, pgTable, text } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

export const currencies = pgTable(
  'currencies',
  {
    id: text().notNull().primaryKey(),
    name: text().notNull().unique(),
    country: text().notNull(),
  },
  (table) => [
    check('currencies_id_check', eq(table.id, sql`lower(${table.id})`)),
    pgPolicy('currencies_allow_select_for_all_policy', {
      as: 'permissive',
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
