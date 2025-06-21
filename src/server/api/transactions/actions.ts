'use server';

import { isBefore, max } from 'date-fns';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { returnValidationErrors } from 'next-safe-action';
import { z } from 'zod';

import { authenticatedActionClient } from '@/lib/api';
import { CACHE_TAGS, revalidateTag } from '@/lib/api/cache';
import { formatDate } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/group-by';
import {
  createTransactionSchema,
  deleteTransactionsSchema,
  updateBalancesSchema,
  updateTransactionSchema,
} from '@/lib/validation/transactions';
import { apiQueries } from '@/server/api/queries';
import { schema } from '@/server/db';
import {
  afterTransaction,
  ascTransactions,
  beforeTransaction,
  descTransactions,
} from '@/server/db/query-utils';

export const createTransaction = authenticatedActionClient
  .schema(createTransactionSchema)
  .action(async ({ parsedInput: params, ctx }) => {
    await ctx.db.rls(async (tx) => {
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

    revalidateTag({ tag: CACHE_TAGS.transactions, userId: ctx.userId });
  });

export const updateBalances = authenticatedActionClient
  .schema(updateBalancesSchema)
  .action(async ({ parsedInput: { balances, description, date }, ctx }) => {
    const subaccountBalances = await apiQueries.accounts.getSubaccountBalances();
    const now = new Date();

    // Create the transactions for each subaccount
    const newTransactions = Object.entries(balances)
      .map(([subaccountId, balance]) => ({
        subaccountId,
        amount: balance - (subaccountBalances[subaccountId]?.balance ?? 0),
        balance,
        type: 'correction' as const,
        description,
        startedDate: date ?? now,
        completedDate: date ?? now,
      }))
      // Filter out transactions for subaccounts with no changes
      .filter((transaction) => transaction.amount !== 0);

    // Check if any transaction date is before the latest transaction date for the subaccount
    if (
      newTransactions.some(
        (transaction) =>
          subaccountBalances[transaction.subaccountId]?.lastTransactionDate &&
          isBefore(
            transaction.startedDate,
            subaccountBalances[transaction.subaccountId].lastTransactionDate,
          ),
      )
    ) {
      const earliestDate = max(
        newTransactions.map(
          (transaction) => subaccountBalances[transaction.subaccountId]?.lastTransactionDate,
        ),
      );

      returnValidationErrors(updateBalancesSchema, {
        // @ts-expect-error - this is a bug in the library, it should be fixed
        date: {
          _errors: [
            `The transaction date can't be before the latest already existing ` +
              `transaction from the updated subaccounts. Earliest possible date is: ` +
              `${formatDate(earliestDate)}`,
          ],
        },
      });
    }

    await ctx.db.rls(async (tx) => {
      if (newTransactions.length > 0) {
        await tx.insert(schema.transactions).values(newTransactions);
      }
    });

    revalidateTag({ tag: CACHE_TAGS.transactions, userId: ctx.userId });
    revalidateTag({ tag: CACHE_TAGS.accounts, userId: ctx.userId });
  });

export const updateTransaction = authenticatedActionClient
  .schema(updateTransactionSchema)
  .action(async ({ parsedInput: params, ctx }) => {
    await ctx.db.rls(async (tx) => {
      // Get the transaction to update
      const [transaction] = await tx
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, params.id));

      if (!transaction) {
        returnValidationErrors(updateTransactionSchema, {
          id: { _errors: ['Transaction not found.'] },
        });
      }

      const amountToAdd = (params.amount ?? transaction.amount) - transaction.amount;
      const dateChanged =
        params.date && params.date.getTime() !== transaction.startedDate.getTime();

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
              beforeTransaction({ ...transaction, startedDate: params.date! }),
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
            startedDate: params.date,
            completedDate: params.date,
            balance: (previousTransaction?.balance ?? 0) + (params.amount ?? transaction.amount),
          })
          .where(eq(schema.transactions.id, params.id));

        // Recalculate all balances after the new date
        await tx
          .update(schema.transactions)
          .set({
            balance: sql`${schema.transactions.balance} + ${params.amount ?? transaction.amount}`,
          })
          .where(afterTransaction({ ...transaction, startedDate: params.date! }));
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
          .where(eq(schema.transactions.id, params.id));

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

    revalidateTag({ tag: CACHE_TAGS.transactions, userId: ctx.userId });
  });

export const deleteTransactions = authenticatedActionClient
  .schema(deleteTransactionsSchema)
  .action(async ({ parsedInput: { transactionIds }, ctx }) => {
    await ctx.db.rls(async (tx) => {
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

    revalidateTag({ tag: CACHE_TAGS.transactions, userId: ctx.userId });
  });

export const deleteTransaction = authenticatedActionClient
  .schema(z.string().uuid())
  .action(async ({ parsedInput: transactionId }) => {
    await deleteTransactions({ transactionIds: [transactionId] });
  });
