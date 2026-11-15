import { and, eq, sql } from 'drizzle-orm';
import { check, index, pgPolicy, pgTable, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { securities } from './securities.schema';
import { transactions } from './transactions.schema';
import { authUid, authUidDefault, numericCasted } from './utils';

// The security side of a buy, sell, split or security transfer transaction
export const investmentTrades = pgTable(
  'investment_trades',
  {
    transactionId: uuid()
      .primaryKey()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    userId: uuid().notNull().default(authUidDefault),
    securityId: uuid()
      .notNull()
      .references(() => securities.id),
    // Negative when shares leave the position
    quantity: numericCasted().notNull(),
    price: numericCasted().notNull(),
  },
  (table) => [
    index().on(table.securityId),
    check('investment_trades_quantity_check', sql`${table.quantity} <> 0`),
    pgPolicy('investment_trades_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: sql`${eq(table.userId, authUid)} AND EXISTS (SELECT 1 FROM ${transactions} WHERE ${and(eq(transactions.id, table.transactionId), eq(transactions.userId, authUid))})`,
    }),
  ],
);
