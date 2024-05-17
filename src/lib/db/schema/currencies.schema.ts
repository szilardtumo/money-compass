import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const currencies = pgTable('currencies', {
  id: uuid('id').notNull().defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  country: text('country').notNull(),
});
