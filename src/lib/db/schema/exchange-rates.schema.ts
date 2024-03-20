import { numeric, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

import { currencies } from './currencies.schema';

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    from: text('from')
      .notNull()
      .references(() => currencies.id, { onUpdate: 'cascade' }),
    to: text('to')
      .notNull()
      .references(() => currencies.id, { onUpdate: 'cascade' }),
    rate: numeric('rate').notNull(),
  },
  (table) => {
    return {
      exchangeRatesPkey: primaryKey({
        columns: [table.from, table.to],
        name: 'exchange_rates_pkey',
      }),
    };
  },
);
