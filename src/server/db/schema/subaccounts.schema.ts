import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { accounts } from './accounts.shema';

export const subaccounts = pgTable('subaccounts', {
  id: uuid('id').notNull().defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  currency: uuid('currency')
    .notNull()
    .references(() => accounts.id, { onUpdate: 'cascade' }),
});
