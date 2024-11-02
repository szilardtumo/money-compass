import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { accounts } from './accounts.shema';

export const subaccounts = pgTable('subaccounts', {
  id: uuid('id').notNull().defaultRandom().primaryKey(),
  name: text('name').notNull().default('Default'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  currency: uuid('currency')
    .notNull()
    .references(() => accounts.id, { onUpdate: 'cascade' }),
});
