'use server';

import { PostgrestError } from '@supabase/supabase-js';
import { isBefore, max } from 'date-fns';
import { and, asc, eq, inArray, InferInsertModel, not, sql } from 'drizzle-orm';

import { CACHE_TAGS, revalidateTag } from '@/lib/api/cache';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { formatDate } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/group-by';
import { getUserId } from '@/server/api/profiles/queries';
import { apiQueries } from '@/server/api/queries';
import { getDb, schema } from '@/server/db';
import {
  afterTransaction,
  ascTransactions,
  beforeTransaction,
  descTransactions,
} from '@/server/db/query-utils';

interface CreateTransactionParams {
  subaccountId: string;
  type: string;
  amount: number;
  description: string;
  date: Date;
}

export async function createTransaction(params: CreateTransactionParams): Promise<ActionResponse> {
  const db = await getDb();

  try {
    await db.rls(async (tx) => {
      const latestTransaction = await tx.query.transactions.findFirst({
        where: beforeTransaction({
          subaccountId: params.subaccountId,
          startedDate: params.date,
          sequence: Infinity, // latest transaction = with the highest sequence
        }),
        orderBy: descTransactions(),
      });

      // Insert the transaction
      await tx.insert(schema.transactions).values({
        type: params.type,
        amount: params.amount,
        balance: (latestTransaction?.balance ?? 0) + params.amount,
        subaccountId: params.subaccountId,
        startedDate: params.date,
        completedDate: params.date,
        description: params.description,
      });

      // Update subsequent transactions balance
      await tx
        .update(schema.transactions)
        .set({
          balance: sql`${schema.transactions.balance} + ${params.amount}`,
        })
        .where(
          afterTransaction({
            subaccountId: params.subaccountId,
            startedDate: params.date,
            sequence: Infinity, // latest transaction = with the highest sequence
          }),
        );
    });

    revalidateTag({ tag: CACHE_TAGS.transactions, userId: await getUserId() });
    return { success: true };
  } catch (error) {
    const postgrestError = error as PostgrestError;
    return {
      success: false,
      error: { code: postgrestError.code, message: postgrestError.message },
    };
  }
}

interface UpdateBalancesParams {
  balances: Record<string, number>;
  description: string;
  date: Date;
}

export async function updateBalances({
  balances,
  description,
  date,
}: UpdateBalancesParams): Promise<ActionResponse> {
  const db = await getDb();
  const subaccountBalances = await apiQueries.accounts.getSubaccountBalances();
  const now = new Date();

  // Create the transactions for each subaccount
  const newTransactions = Object.entries(balances)
    .map(
      ([subaccountId, balance]) =>
        ({
          subaccountId,
          amount: balance - (subaccountBalances[subaccountId]?.balance ?? 0),
          balance,
          type: 'correction' as const,
          description,
          startedDate: date ?? now,
          completedDate: date ?? now,
        }) satisfies InferInsertModel<typeof schema.transactions>,
    )
    // Filter out transactions for subaccounts with no changes
    .filter((transaction) => transaction.amount !== 0);

  // Check if any transaction date is before the latest transaction date for the subaccount
  if (
    newTransactions.some((transaction) =>
      isBefore(
        transaction.startedDate,
        subaccountBalances[transaction.subaccountId]?.lastTransactionDate,
      ),
    )
  ) {
    const earliestDate = max(
      newTransactions.map(
        (transaction) => subaccountBalances[transaction.subaccountId]?.lastTransactionDate,
      ),
    );

    return {
      success: false,
      error: {
        code: ActionErrorCode.ValidationError,
        message:
          `The transaction date can't be before the latest already existing ` +
          `transaction from the updated subaccounts. Earliest possible date is: ` +
          `${formatDate(earliestDate)}`,
      },
    };
  }

  await db.rls(async (tx) => {
    await tx.insert(schema.transactions).values(newTransactions);
  });

  revalidateTag({ tag: CACHE_TAGS.transactions, userId: await getUserId() });
  revalidateTag({ tag: CACHE_TAGS.accounts, userId: await getUserId() });
  return { success: true };
}

interface UpdateTransactionParams {
  type?: string;
  amount?: number;
  description?: string;
  startedDate?: Date;
}

export async function updateTransaction(
  transactionId: string,
  params: UpdateTransactionParams,
): Promise<ActionResponse> {
  const db = await getDb();

  try {
    await db.rls(async (tx) => {
      // Get the transaction to update
      const [transaction] = await tx
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, transactionId));

      if (!transaction) {
        throw new Error('Transaction not found.');
      }

      const amountToAdd = (params.amount ?? transaction.amount) - transaction.amount;
      const dateChanged =
        params.startedDate && params.startedDate.getTime() !== transaction.startedDate.getTime();

      // If date is changing, we need to handle reordering
      if (dateChanged) {
        // First, revert the impact of this transaction on later transactions
        await tx
          .update(schema.transactions)
          .set({
            balance: sql`${schema.transactions.balance} - ${transaction.amount}`,
          })
          .where(afterTransaction(transaction));

        // Get the previous transaction at the new date to calculate the correct balance
        const [previousTransaction] = await tx
          .select()
          .from(schema.transactions)
          .where(
            and(
              not(eq(schema.transactions.id, transaction.id)),
              beforeTransaction({ ...transaction, startedDate: params.startedDate! }),
            ),
          )
          .orderBy(...descTransactions())
          .limit(1);

        // Update the transaction itself with the correct balance
        await tx
          .update(schema.transactions)
          .set({
            type: params.type ?? transaction.type,
            amount: params.amount ?? transaction.amount,
            description: params.description ?? transaction.description,
            startedDate: params.startedDate,
            completedDate: params.startedDate,
            balance: (previousTransaction?.balance ?? 0) + (params.amount ?? transaction.amount),
          })
          .where(eq(schema.transactions.id, transactionId));

        // Recalculate all balances after the new date
        await tx
          .update(schema.transactions)
          .set({
            balance: sql`${schema.transactions.balance} + ${params.amount ?? transaction.amount}`,
          })
          .where(afterTransaction({ ...transaction, startedDate: params.startedDate! }));
      } else {
        // Simple update without date change
        await tx
          .update(schema.transactions)
          .set({
            type: params.type ?? transaction.type,
            amount: params.amount ?? transaction.amount,
            description: params.description ?? transaction.description,
            balance: transaction.balance + amountToAdd,
          })
          .where(eq(schema.transactions.id, transactionId));

        // Update subsequent transactions if amount changed
        if (amountToAdd) {
          await tx
            .update(schema.transactions)
            .set({
              balance: sql`${schema.transactions.balance} + ${amountToAdd}`,
            })
            .where(afterTransaction(transaction));
        }
      }
    });

    revalidateTag({ tag: CACHE_TAGS.transactions, userId: await getUserId() });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: error instanceof Error ? ActionErrorCode.Unknown : (error as PostgrestError).code,
        message: error instanceof Error ? error.message : (error as PostgrestError).message,
      },
    };
  }
}

export async function deleteTransactions(transactionIds: string[]): Promise<ActionResponse> {
  const db = await getDb();

  try {
    await db.rls(async (tx) => {
      // Get all transactions to be deleted (oldest first)
      const transactionsToDelete = await tx
        .select()
        .from(schema.transactions)
        .where(inArray(schema.transactions.id, transactionIds))
        .orderBy(...ascTransactions());

      // Group by subaccount and calculate cumulative amounts
      const updateOperations = Object.values(
        groupBy(transactionsToDelete, (t) => t.subaccountId),
      ).flatMap((deletedTransactions) =>
        // For each subaccount, create update operations with running totals
        deletedTransactions.map((transaction, index) => {
          const nextTransaction = deletedTransactions[index + 1];
          const cumulativeAmount = deletedTransactions
            .slice(0, index + 1)
            .reduce((sum, t) => sum + t.amount, 0);

          return tx
            .update(schema.transactions)
            .set({
              balance: sql`${schema.transactions.balance} - ${cumulativeAmount}`,
            })
            .where(
              and(
                afterTransaction(transaction),
                // If there's a next transaction to delete, only update until that point
                nextTransaction ? beforeTransaction(nextTransaction) : undefined,
              ),
            );
        }),
      );

      // Execute all balance updates in parallel
      await Promise.all(updateOperations);

      // Delete the transactions
      await tx.delete(schema.transactions).where(inArray(schema.transactions.id, transactionIds));
    });

    revalidateTag({ tag: CACHE_TAGS.transactions, userId: await getUserId() });
    return { success: true };
  } catch (error) {
    const postgrestError = error as PostgrestError;
    return {
      success: false,
      error: { code: postgrestError.code, message: postgrestError.message },
    };
  }
}

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

  revalidateTag({ tag: CACHE_TAGS.transactions, userId: await getUserId() });
}
