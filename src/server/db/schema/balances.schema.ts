import { sql } from 'drizzle-orm';
import { pgView } from 'drizzle-orm/pg-core';

import { descTransactions } from '@/server/db/query-utils';

import { transactions } from './transactions.schema';

export const balances = pgView('balances')
  .with({ securityInvoker: true })
  .as((qb) =>
    qb
      // https://github.com/drizzle-team/drizzle-orm/issues/3332
      .selectDistinctOn([transactions.subaccountId], {
        subaccountId: sql<string>`"subaccount_id"`.as('subaccount_id'),
        balance: transactions.balance,
        lastTransactionDate: sql`"started_date"`
          .mapWith(transactions.startedDate)
          .as('started_date'),
      })
      .from(transactions)
      .orderBy(transactions.subaccountId, ...descTransactions()),
  );
