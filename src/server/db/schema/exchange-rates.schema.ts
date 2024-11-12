import { sql } from 'drizzle-orm';
import { pgPolicy, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { currencies } from './currencies.schema';
import { numericCasted } from './utils';

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    from: text()
      .notNull()
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    to: text()
      .notNull()
      .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    rate: numericCasted('rate').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'exchange_rates_pkey',
      columns: [table.from, table.to],
    }),
    pgPolicy('exchange_rates_allow_select_for_all_policy', {
      as: 'permissive',
      for: 'select',
      to: authenticatedRole,
      using: sql``,
    }),
  ],
);
