import { and, eq, relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { accounts } from './accounts.schema';
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
    type: text().notNull(),
    counterpartyName: text().default('').notNull(),
    dataSource: text({ enum: ['integration', 'manual'] })
      .default('manual')
      .notNull(),
    // The transaction as the bank sent it, for features that need more than the columns above
    bankData: jsonb(),
    subaccountId: uuid()
      .notNull()
      .references(() => subaccounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: uuid().notNull().default(authUidDefault),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    sequence: integer('sequence').generatedAlwaysAsIdentity().notNull().unique(),
  },
  (table) => [
    index().on(table.userId, table.subaccountId, table.startedDate.desc(), table.sequence.desc()),
    // The sync skips known transactions with "on conflict do nothing". NULL references never conflict.
    uniqueIndex().on(table.subaccountId, table.externalRef),
    pgPolicy('transactions_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: sql`${eq(table.userId, authUid)} AND EXISTS (SELECT 1 FROM ${subaccounts} JOIN ${accounts} ON ${eq(accounts.id, subaccounts.accountId)} WHERE ${and(eq(subaccounts.id, table.subaccountId), eq(accounts.userId, authUid))})`,
    }),
  ],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  subaccount: one(subaccounts),
}));
