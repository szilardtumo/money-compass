import { pgTable, text } from 'drizzle-orm/pg-core';

export const currencies = pgTable('currencies', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull().unique(),
  country: text('country').notNull(),
});
