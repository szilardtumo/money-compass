import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { accountCategory } from './enums.schema';

export const accounts = pgTable('accounts', {
  id: uuid('id').notNull().defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  name: text('name').notNull(),
  userId: uuid('user_id')
    .notNull()
    .default(sql`auth.uid()`),
  category: accountCategory('category').notNull(),
});
