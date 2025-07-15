'use server';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { returnValidationErrors } from 'next-safe-action';
import { z } from 'zod';

import { authenticatedActionClient } from '@/lib/api';
import { CACHE_TAGS, revalidateTag } from '@/lib/api/cache';
import { createAccountSchema, updateAccountSchema } from '@/lib/validation/accounts';
import { apiQueries } from '@/server/api/queries';
import { DbTx, schema } from '@/server/db';

interface CreateSubaccountParams {
  accountId: string;
  name: string;
  currency: string;
}

/**
 * Creates new subaccounts
 *
 * @internal
 *
 * @param params A list of parameters to create the subaccounts.
 * @param tx The database transaction to use.
 * @returns
 */
async function _createSubaccounts(params: CreateSubaccountParams[], tx: DbTx): Promise<void> {
  if (!params.length) {
    return;
  }

  await tx.insert(schema.subaccounts).values(
    params.map((item) => ({
      accountId: item.accountId,
      name: item.name,
      currency: item.currency,
    })),
  );

  return;
}

/**
 * Deletes subaccounts with the specified ids
 *
 * @internal
 * @param subaccountIds A list of subaccount ids
 * @param tx The database transaction to use.
 * @returns
 */
async function _deleteSubaccounts(subaccountIds: string[], tx: DbTx): Promise<void> {
  await tx.delete(schema.subaccounts).where(inArray(schema.subaccounts.id, subaccountIds));
}

interface UpdateSubaccountParams {
  id: string;
  name?: string;
  currency?: string;
}

async function _updateSubaccounts(params: UpdateSubaccountParams[], tx: DbTx): Promise<void> {
  const dbSubaccounts = await tx
    .select()
    .from(schema.subaccounts)
    .where(
      inArray(
        schema.subaccounts.id,
        params.map((subaccount) => subaccount.id),
      ),
    );

  const currencyChangeSubaccounts =
    params
      .map((subaccount) => ({
        subaccount,
        prevSubaccount: dbSubaccounts.find((item) => item.id === subaccount.id),
      }))
      .filter(
        ({ subaccount, prevSubaccount }) =>
          prevSubaccount && subaccount.currency && subaccount.currency !== prevSubaccount.currency,
      ) ?? [];

  await Promise.all([
    // Update existing subaccounts
    ...params.map((subaccount) =>
      tx
        .update(schema.subaccounts)
        .set({ name: subaccount.name, currency: subaccount.currency })
        .where(eq(schema.subaccounts.id, subaccount.id)),
    ),
    // Update transactions where the subaccount's currency changed
    ...currencyChangeSubaccounts.map(async ({ subaccount, prevSubaccount }) => {
      const [{ rate }] = await tx
        .select({ rate: schema.exchangeRates.rate })
        .from(schema.exchangeRates)
        .where(
          and(
            eq(schema.exchangeRates.to, subaccount.currency!),
            eq(schema.exchangeRates.from, prevSubaccount!.currency),
          ),
        )
        .execute();

      await tx
        .update(schema.transactions)
        .set({
          amount: sql`${schema.transactions.amount} * ${rate}`,
          balance: sql`${schema.transactions.balance} * ${rate}`,
        })
        .where(eq(schema.transactions.subaccountId, subaccount.id));
    }),
  ]);
}

/**
 * Creates a new account with subaccounts.
 */
export const createAccount = authenticatedActionClient
  .inputSchema(createAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    await ctx.db.rls(async (tx) => {
      const [{ id }] = await tx
        .insert(schema.accounts)
        .values({ name: parsedInput.name, category: parsedInput.category })
        .returning({ id: schema.accounts.id });

      if (parsedInput.subaccounts?.length) {
        await _createSubaccounts(
          parsedInput.subaccounts.map((subaccount) => ({
            accountId: id,
            name: subaccount.name,
            currency: subaccount.originalCurrency,
          })),
          tx,
        );
      }
    });

    revalidateTag({ tag: CACHE_TAGS.accounts, userId: ctx.userId });
  });

export const updateAccount = authenticatedActionClient
  .inputSchema(updateAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const account = await apiQueries.accounts.getAccount(parsedInput.id);

    if (!account) {
      returnValidationErrors(updateAccountSchema, {
        _errors: ['Account not found'],
      });
    }

    const subaccountsToDelete =
      parsedInput.subaccounts?.filter(
        (
          subaccount,
        ): subaccount is { name: string; originalCurrency: string; id: string; delete: true } =>
          'id' in subaccount && 'delete' in subaccount && subaccount.delete === true,
      ) ?? [];

    const newSubaccounts =
      parsedInput.subaccounts?.filter(
        (subaccount): subaccount is { name: string; originalCurrency: string } =>
          !('id' in subaccount),
      ) ?? [];

    const existingSubaccounts =
      parsedInput.subaccounts?.filter(
        (subaccount): subaccount is { id: string; name: string; originalCurrency: string } =>
          'id' in subaccount && !subaccount.delete,
      ) ?? [];

    await ctx.db.rls(async (tx) => {
      // Update account
      await tx
        .update(schema.accounts)
        .set({
          name: parsedInput.name,
          category: parsedInput.category,
        })
        .where(eq(schema.accounts.id, parsedInput.id));

      if (parsedInput.subaccounts && parsedInput.subaccounts.length) {
        await Promise.all([
          _deleteSubaccounts(
            subaccountsToDelete.map((subaccount) => subaccount.id),
            tx,
          ),
          _createSubaccounts(
            newSubaccounts.map((subaccount) => ({
              accountId: parsedInput.id,
              name: subaccount.name,
              currency: subaccount.originalCurrency,
            })),
            tx,
          ),
          _updateSubaccounts(
            existingSubaccounts.map((subaccount) => ({
              id: subaccount.id,
              name: subaccount.name,
              currency: subaccount.originalCurrency,
            })),
            tx,
          ),
        ]);
      }
    });

    revalidateTag({ tag: CACHE_TAGS.accounts, userId: ctx.userId });
  });

export const deleteAccount = authenticatedActionClient
  .inputSchema(
    z.object({
      accountId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    await ctx.db.rls((tx) =>
      tx.delete(schema.accounts).where(eq(schema.accounts.id, parsedInput.accountId)),
    );

    revalidateTag({ tag: CACHE_TAGS.accounts, userId: ctx.userId });
    revalidateTag({ tag: CACHE_TAGS.transactions, userId: ctx.userId });
  });
