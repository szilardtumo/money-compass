'use server';

import { isBefore, max } from 'date-fns';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { returnValidationErrors } from 'next-safe-action';
import { z } from 'zod';

import { authenticatedActionClient } from '@/lib/api';
import { formatDate } from '@/lib/utils/formatters';
import {
  createTransactionSchema,
  deleteTransactionsSchema,
  updateBalancesSchema,
  updateTransactionSchema,
} from '@/lib/validation/transactions';
import { apiQueries } from '@/server/api/queries';
import { schema } from '@/server/db';

export const createTransaction = authenticatedActionClient
  .inputSchema(createTransactionSchema)
  .action(async ({ parsedInput: params, ctx }) => {
    await ctx.db.rls((tx) =>
      tx.insert(schema.transactions).values({
        type: params.type,
        amount: params.amount,
        subaccountId: params.subaccountId,
        startedDate: params.date,
        completedDate: params.date,
        description: params.description,
      }),
    );

    revalidatePath('/dashboard', 'layout');
  });

export const updateBalances = authenticatedActionClient
  .inputSchema(updateBalancesSchema)
  .action(async ({ parsedInput: { balances, description, date }, ctx }) => {
    const subaccountBalances = await apiQueries.accounts.getSubaccountBalances();
    const now = new Date();

    // Create the transactions for each subaccount
    const newTransactions = Object.entries(balances)
      .map(([subaccountId, balance]) => ({
        subaccountId,
        amount: balance - (subaccountBalances[subaccountId]?.balance ?? 0),
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

    revalidatePath('/dashboard', 'layout');
  });

export const updateTransaction = authenticatedActionClient
  .inputSchema(updateTransactionSchema)
  .action(async ({ parsedInput: params, ctx }) => {
    const [transaction] = await ctx.db.rls((tx) =>
      tx
        .update(schema.transactions)
        .set({
          type: params.type,
          amount: params.amount,
          description: params.description,
          startedDate: params.date,
          completedDate: params.date,
        })
        .where(eq(schema.transactions.id, params.id))
        .returning({ id: schema.transactions.id }),
    );

    if (!transaction) {
      returnValidationErrors(updateTransactionSchema, {
        id: { _errors: ['Transaction not found.'] },
      });
    }

    revalidatePath('/dashboard', 'layout');
  });

export const deleteTransactions = authenticatedActionClient
  .inputSchema(deleteTransactionsSchema)
  .action(async ({ parsedInput: { transactionIds }, ctx }) => {
    await ctx.db.rls((tx) =>
      tx.delete(schema.transactions).where(inArray(schema.transactions.id, transactionIds)),
    );

    revalidatePath('/dashboard', 'layout');
  });

export const deleteTransaction = authenticatedActionClient
  .inputSchema(z.uuid())
  .action(async ({ parsedInput: transactionId }) => {
    await deleteTransactions({ transactionIds: [transactionId] });
  });
