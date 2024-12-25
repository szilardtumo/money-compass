import { eq, relations } from 'drizzle-orm';
import { index, integer, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { transactionType } from './enums.schema';
import { subaccounts } from './subaccounts.schema';
import { numericCasted, authUid, authUidDefault } from './utils';

export const transactions = pgTable(
  'transactions',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    externalRef: text(),
    amount: numericCasted().notNull(),
    startedDate: timestamp({ withTimezone: true }).notNull(),
    completedDate: timestamp({ withTimezone: true }).notNull(),
    description: text().default('').notNull(),
    type: transactionType().notNull(),
    subaccountId: uuid()
      .notNull()
      .references(() => subaccounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    balance: numericCasted().notNull(),
    userId: uuid().notNull().default(authUidDefault),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    sequence: integer('sequence').generatedAlwaysAsIdentity().notNull().unique(),
  },
  (table) => [
    index().on(table.userId, table.subaccountId, table.startedDate.desc(), table.sequence.desc()),
    pgPolicy('transactions_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: eq(table.userId, authUid),
    }),
  ],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  subaccount: one(subaccounts),
}));
