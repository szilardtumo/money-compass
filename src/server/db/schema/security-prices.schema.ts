import { sql } from 'drizzle-orm';
import { date, pgPolicy, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { currencies } from './currencies.schema';
import { securities } from './securities.schema';
import { numericCasted } from './utils';

// Daily closes shared by all users, written only by the admin client
export const securityPrices = pgTable(
  'security_prices',
  {
    securityId: uuid()
      .notNull()
      .references(() => securities.id, { onDelete: 'cascade' }),
    date: date({ mode: 'string' }).notNull(),
    close: numericCasted().notNull(),
    currency: text()
      .notNull()
      .references(() => currencies.id, { onUpdate: 'cascade' }),
    source: text({ enum: ['yahoo', 'ibkr', 'manual'] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.securityId, table.date] }),
    pgPolicy('security_prices_allow_select_for_all_policy', {
      as: 'permissive',
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
