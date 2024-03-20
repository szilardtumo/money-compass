import { index, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { transactionType } from './enums.schema';
import { subaccounts } from './subaccounts.schema';

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').notNull().defaultRandom().primaryKey(),
    externalRef: text('external_ref'),
    amount: numeric('amount').notNull(),
    startedDate: timestamp('started_date').notNull(),
    completedDate: timestamp('completed_date').notNull(),
    description: text('description').default('').notNull(),
    type: transactionType('type').notNull(),
    subaccountId: uuid('subaccount_id')
      .notNull()
      .references(() => subaccounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    balance: numeric('balance').notNull(),
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
