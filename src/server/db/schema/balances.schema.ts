import { sql } from 'drizzle-orm';
import { pgView, timestamp, uuid } from 'drizzle-orm/pg-core';

import { numericCasted } from './utils';

// Raw SQL because drizzle-kit ignores the snake_case setting in view queries
// https://github.com/drizzle-team/drizzle-orm/issues/3332
export const balances = pgView('balances', {
  subaccountId: uuid().notNull(),
  balance: numericCasted().notNull(),
  lastTransactionDate: timestamp({ withTimezone: true }).notNull(),
})
  .with({ securityInvoker: true })
  .as(
    sql`select subaccount_id, sum(amount) as balance, max(started_date) as last_transaction_date from transactions group by subaccount_id`,
  );

export const transactionBalances = pgView('transaction_balances', {
  transactionId: uuid().notNull(),
  balance: numericCasted().notNull(),
})
  .with({ securityInvoker: true })
  .as(
    sql`select id as transaction_id, sum(amount) over (partition by subaccount_id order by started_date, sequence) as balance from transactions`,
  );
