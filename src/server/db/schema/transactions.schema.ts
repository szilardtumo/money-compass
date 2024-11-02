import { sql } from 'drizzle-orm';
import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { numericCasted } from './custom-types/numericCasted';
import { transactionType } from './enums.schema';
import { subaccounts } from './subaccounts.schema';

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').notNull().defaultRandom().primaryKey(),
    externalRef: text('external_ref'),
    amount: numericCasted('amount', { precision: 65, scale: 30 }).notNull(),
    startedDate: timestamp('started_date', { withTimezone: true }).notNull(),
    completedDate: timestamp('completed_date', { withTimezone: true }).notNull(),
    description: text('description').default('').notNull(),
    type: transactionType('type').notNull(),
    subaccountId: uuid('subaccount_id')
      .notNull()
      .references(() => subaccounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    balance: numericCasted('balance').notNull(),
    userId: uuid('user_id')
      .notNull()
      .default(sql`auth.uid()`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    sequence: integer('sequence').generatedAlwaysAsIdentity().notNull().unique(),
  },
  (table) => {
    return {
      startedDateIdx: index('transactions_started_date_idx').on(table.startedDate),
      transactionsPkey: primaryKey({
        columns: [table.id, table.startedDate],
        name: 'transactions_pkey',
      }),
    };
  },
);
