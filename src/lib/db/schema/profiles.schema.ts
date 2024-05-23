import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { currencies } from '@/lib/db/schema/currencies.schema';

export const profiles = pgTable('profiles', {
  id: uuid('id').notNull().primaryKey(),
  mainCurrency: text('main_currency')
    .notNull()
    .default('eur')
    .references(() => currencies.id, { onUpdate: 'cascade', onDelete: 'set default' }),
});
