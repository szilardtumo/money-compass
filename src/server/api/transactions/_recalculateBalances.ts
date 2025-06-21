'use server';

import { asc } from 'drizzle-orm';

import { revalidateTag, CACHE_TAGS } from '@/lib/api/cache';
import { groupBy } from '@/lib/utils/group-by';
import { schema, getDb } from '@/server/db';
import { ascTransactions } from '@/server/db/query-utils';

export async function _recalculateBalances() {
  const db = await getDb();

  // Get all transactions ordered by subaccount, then by transaction date
  // WARNING: This bypasses RLS
  const allTransactions = await db.admin
    .select()
    .from(schema.transactions)
    .orderBy(asc(schema.transactions.subaccountId), ...ascTransactions());

  // Group transactions by subaccount
  const bySubaccount = groupBy(allTransactions, (t) => t.subaccountId);

  // For each subaccount, update balances sequentially
  await Promise.all(
    Object.values(bySubaccount).map(async (subaccountTransactions) => {
      let runningBalance = 0;

      // Update each transaction's balance based on the running total
      for (const transaction of subaccountTransactions) {
        runningBalance += transaction.amount;

        if (Math.abs(transaction.balance - runningBalance) > 0.0001) {
          // eslint-disable-next-line no-console
          console.log([
            'balance not correct (date, prev, curr)',
            transaction.startedDate,
            transaction.balance,
            runningBalance,
          ]);

          // await db.admin
          //   .update(transactions)
          //   .set({ balance: runningBalance })
          //   .where(eq(transactions.id, transaction.id));
        }
      }

      // eslint-disable-next-line no-console
      console.log(['done', subaccountTransactions[0]?.subaccountId]);
    }),
  );

  revalidateTag({ tag: CACHE_TAGS.transactions });
}
