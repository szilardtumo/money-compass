'use server';

import { PostgrestError } from '@supabase/supabase-js';
import { and, asc, desc, eq, inArray, not, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { groupBy } from '@/lib/utils/group-by';
import { apiQueries } from '@/server/api/queries';
import { getDb } from '@/server/db';
import { transactions } from '@/server/db/schema';

type TransactionForQueryHelper = Pick<
  typeof transactions.$inferSelect,
  'subaccountId' | 'startedDate' | 'createdAt'
>;

/**
 * Drizzle query helper for ordering transactions in ascending order
 */
function ascTransactions() {
  return [asc(transactions.startedDate), asc(transactions.createdAt)];
}

/**
 * Drizzle query helper for ordering transactions in descending order
 */
function descTransactions() {
  return [desc(transactions.startedDate), desc(transactions.createdAt)];
}

/**
 * Drizzle query helper for filtering transactions after a transaction
 */
function afterTransaction(transaction: TransactionForQueryHelper) {
  // FIXME: PostgreSQL stores timestamps in microseconds, but JS Date can only store it in milliseconds
  //        Because of this inconsistency, we need to add 1ms to avoid selecting the current transaction
  //        Possible solution: set the precision to milliseconds in PostgreSQL
  return and(
    eq(transactions.subaccountId, transaction.subaccountId),
    sql`(${transactions.startedDate}, ${transactions.createdAt}) > (${transaction.startedDate.toISOString()}, ${new Date(transaction.createdAt.getTime() + 1).toISOString()})`,
  );
}

/**
 * Drizzle query helper for filtering transactions before a transaction
 */
function beforeTransaction(transaction: TransactionForQueryHelper) {
  return and(
    eq(transactions.subaccountId, transaction.subaccountId),
    sql`(${transactions.startedDate}, ${transactions.createdAt}) < (${transaction.startedDate.toISOString()}, ${transaction.createdAt.toISOString()})`,
  );
}

interface CreateTransactionParams {
  subaccountId: string;
  type: Enums<'transaction_type'>;
  amount: number;
  description: string;
  date: string;
}

export async function createTransaction(params: CreateTransactionParams): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  try {
    const {
      data: [latestTransaction],
    } = await apiQueries.transactions.getTransactions({
      pageSize: 1,
      subaccountId: params.subaccountId,
      toDate: params.date,
    });

    const { error } = await supabase.from('transactions').insert({
      type: params.type,
      amount: params.amount,
      balance: (latestTransaction?.balance.originalValue ?? 0) + params.amount,
      subaccount_id: params.subaccountId,
      description: params.description,
      started_date: params.date,
      completed_date: params.date,
    });

    if (error) {
      return { success: false, error: { code: error.code, message: error.message } };
    }

    await supabase.rpc('update_transaction_balances', {
      _subaccount_id: params.subaccountId,
      fromdate: params.date,
      amounttoadd: params.amount,
    });

    revalidateTag('transactions');
    return { success: true };
  } catch (error) {
    const postgrestError = error as PostgrestError;
    return {
      success: false,
      error: { code: postgrestError.code, message: postgrestError.message },
    };
  }
}

export async function createTransactions(
  transactions: CreateTransactionParams[],
): Promise<ActionResponse> {
  const supabase = createServerSupabaseClient();

  try {
    const subaccountBalances = await apiQueries.accounts.getSubaccountBalances();
    const now = new Date().toISOString();

    const { error } = await supabase.from('transactions').insert(
      transactions.map((transaction) => ({
        type: transaction.type,
        amount: transaction.amount,
        balance: (subaccountBalances[transaction.subaccountId] ?? 0) + transaction.amount,
        subaccount_id: transaction.subaccountId,
        description: transaction.description,
        started_date: now,
        completed_date: now,
      })),
    );

    if (error) {
      return { success: false, error: { code: error.code, message: error.message } };
    }

    revalidateTag('transactions');
    return { success: true };
  } catch (error) {
    const postgrestError = error as PostgrestError;
    return {
      success: false,
      error: { code: postgrestError.code, message: postgrestError.message },
    };
  }
}

interface UpdateTransactionParams {
  type?: Enums<'transaction_type'>;
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
    await db.transaction(async (tx) => {
      // Get the transaction to update
      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));

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
          .update(transactions)
          .set({
            balance: sql`${transactions.balance} - ${transaction.amount}`,
          })
          .where(afterTransaction(transaction));

        // Get the previous transaction at the new date to calculate the correct balance
        const [previousTransaction] = await tx
          .select()
          .from(transactions)
          .where(
            and(
              not(eq(transactions.id, transaction.id)),
              beforeTransaction({ ...transaction, startedDate: params.startedDate! }),
            ),
          )
          .orderBy(...descTransactions())
          .limit(1);

        // Update the transaction itself with the correct balance
        await tx
          .update(transactions)
          .set({
            type: params.type ?? transaction.type,
            amount: params.amount ?? transaction.amount,
            description: params.description ?? transaction.description,
            startedDate: params.startedDate,
            completedDate: params.startedDate,
            balance: (previousTransaction?.balance ?? 0) + (params.amount ?? transaction.amount),
          })
          .where(eq(transactions.id, transactionId));

        // Recalculate all balances after the new date
        await tx
          .update(transactions)
          .set({
            balance: sql`${transactions.balance} + ${params.amount ?? transaction.amount}`,
          })
          .where(afterTransaction({ ...transaction, startedDate: params.startedDate! }));
      } else {
        // Simple update without date change
        await tx
          .update(transactions)
          .set({
            type: params.type ?? transaction.type,
            amount: params.amount ?? transaction.amount,
            description: params.description ?? transaction.description,
            balance: transaction.balance + amountToAdd,
          })
          .where(eq(transactions.id, transactionId));

        // Update subsequent transactions if amount changed
        if (amountToAdd) {
          await tx
            .update(transactions)
            .set({
              balance: sql`${transactions.balance} + ${amountToAdd}`,
            })
            .where(afterTransaction(transaction));
        }
      }
    });

    revalidateTag('transactions');
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
    await db.transaction(async (tx) => {
      // Get all transactions to be deleted (oldest first)
      const transactionsToDelete = await tx
        .select()
        .from(transactions)
        .where(inArray(transactions.id, transactionIds))
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
            .update(transactions)
            .set({
              balance: sql`${transactions.balance} - ${cumulativeAmount}`,
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
      await tx.delete(transactions).where(inArray(transactions.id, transactionIds));
    });

    revalidateTag('transactions');
    return { success: true };
  } catch (error) {
    const postgrestError = error as PostgrestError;
    return {
      success: false,
      error: { code: postgrestError.code, message: postgrestError.message },
    };
  }
}
