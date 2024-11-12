import { desc } from 'drizzle-orm';
import { pgView } from 'drizzle-orm/pg-core';

import { transactions } from './transactions.schema';

export const balances = pgView('balances')
  .with({ securityInvoker: true })
  .as((qb) =>
    qb
      .selectDistinctOn([transactions.subaccountId], {
        subaccountId: transactions.subaccountId,
        balanse: transactions.balance,
        lastTransactionDate: transactions.startedDate,
      })
      .from(transactions)
      .orderBy(transactions.subaccountId, desc(transactions.startedDate), transactions.sequence),
  );
