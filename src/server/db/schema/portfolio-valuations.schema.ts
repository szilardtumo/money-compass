import { and, eq, sql } from 'drizzle-orm';
import { date, pgPolicy, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { accounts } from './accounts.schema';
import { subaccounts } from './subaccounts.schema';
import { authUid, authUidDefault, numericCasted } from './utils';

// The holdings of a subaccount at each day's close, in the subaccount's currency
export const portfolioValuations = pgTable(
  'portfolio_valuations',
  {
    subaccountId: uuid()
      .notNull()
      .references(() => subaccounts.id, { onDelete: 'cascade' }),
    userId: uuid().notNull().default(authUidDefault),
    date: date({ mode: 'string' }).notNull(),
    marketValue: numericCasted().notNull(),
    costBasis: numericCasted().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.subaccountId, table.date] }),
    pgPolicy('portfolio_valuations_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: sql`${eq(table.userId, authUid)} AND EXISTS (SELECT 1 FROM ${subaccounts} JOIN ${accounts} ON ${eq(accounts.id, subaccounts.accountId)} WHERE ${and(eq(subaccounts.id, table.subaccountId), eq(accounts.userId, authUid))})`,
    }),
  ],
);
