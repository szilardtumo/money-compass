import { sql } from 'drizzle-orm';
import { pgPolicy, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { currencies } from './currencies.schema';

// Market data shared by all users, written only by the admin client
export const securities = pgTable(
  'securities',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    isin: text(),
    symbol: text().notNull(),
    exchange: text().notNull(),
    // The symbol at the price source, like "VWCE.DE"
    quoteSymbol: text(),
    name: text().notNull(),
    currency: text()
      .notNull()
      .references(() => currencies.id, { onUpdate: 'cascade' }),
    kind: text({ enum: ['stock', 'etf', 'fund', 'bond', 'other'] }).notNull(),
    // Unpriced securities are valued at the broker's last price
    priceStatus: text({ enum: ['priced', 'unpriced'] })
      .notNull()
      .default('priced'),
  },
  (table) => [
    uniqueIndex().on(table.isin),
    uniqueIndex()
      .on(table.symbol, table.exchange)
      .where(sql`${table.isin} IS NULL`),
    pgPolicy('securities_allow_select_for_all_policy', {
      as: 'permissive',
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
