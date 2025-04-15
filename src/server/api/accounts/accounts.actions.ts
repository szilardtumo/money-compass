'use server';

import { and, eq, inArray, sql } from 'drizzle-orm';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { getUserId } from '@/server/api/profiles/queries';
import { apiQueries } from '@/server/api/queries';
import { DbTx, getDb, schema } from '@/server/db';

interface CreateSubaccountParams {
  accountId: string;
  name: string;
  currency: string;
}

/**
 * Creates new subaccounts
 *
 * @param params A list of parameters to create the subaccounts.
 * @param tx The database transaction to use.
 * @returns
 */
async function createSubaccounts(
  params: CreateSubaccountParams[],
  tx: DbTx,
): Promise<ActionResponse> {
  if (!params.length) {
    return { success: true };
  }

  await tx.insert(schema.subaccounts).values(
    params.map((item) => ({
      accountId: item.accountId,
      name: item.name,
      currency: item.currency,
    })),
  );

  revalidateTag({ tag: CACHE_TAGS.accounts, userId: await getUserId() });
  return { success: true };
}

/**
 * Deletes subaccounts with the specified ids
 *
 * @param subaccountIds A list of subaccount ids
 * @param tx The database transaction to use.
 * @returns
 */
async function deleteSubaccounts(subaccountIds: string[], tx: DbTx): Promise<ActionResponse> {
  await tx.delete(schema.subaccounts).where(inArray(schema.subaccounts.id, subaccountIds));

  revalidateTag({ tag: CACHE_TAGS.accounts, userId: await getUserId() });
  return { success: true };
}

interface UpdateSubaccountParams {
  id: string;
  name?: string;
  currency?: string;
}

async function updateSubaccounts(
  params: UpdateSubaccountParams[],
  tx: DbTx,
): Promise<ActionResponse> {
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

  if (currencyChangeSubaccounts.length) {
    revalidateTag({ tag: CACHE_TAGS.transactions, userId: await getUserId() });
  }
  revalidateTag({ tag: CACHE_TAGS.accounts, userId: await getUserId() });
  return { success: true };
}

interface CreateAccountParams {
  name: string;
  category: Enums<'account_category'>;
  subaccounts?: { name: string; originalCurrency: string }[];
}

/**
 * Creates a new account with a subaccounts.
 *
 * @param params The parameters to create the account.
 * @returns
 */
export async function createAccount(params: CreateAccountParams): Promise<ActionResponse> {
  const db = await getDb();

  await db.rls(
    async (tx) => {
      const [{ id }] = await tx
        .insert(schema.accounts)
        .values({ name: params.name, category: params.category })
        .returning({ id: schema.accounts.id });

      if (params.subaccounts?.length) {
        await createSubaccounts(
          params.subaccounts.map((subaccount) => ({
            accountId: id,
            name: subaccount.name,
            currency: subaccount.originalCurrency,
          })),
          tx,
        );
      }
    },
    // { isolationLevel: 'read uncommitted' },
  );

  revalidateTag({ tag: CACHE_TAGS.accounts, userId: await getUserId() });
  return { success: true };
}

interface UpdateAccountParams {
  name?: string;
  category?: Enums<'account_category'>;
  subaccounts?: (
    | { id: string; name?: string; originalCurrency?: string; delete?: true }
    | { name: string; originalCurrency: string }
  )[];
}

export async function updateAccount(
  id: string,
  params: UpdateAccountParams,
): Promise<ActionResponse> {
  const db = await getDb();
  const account = await apiQueries.accounts.getAccount(id);

  if (!account) {
    return {
      success: false,
      error: { code: ActionErrorCode.NotFound, message: 'Account not found.' },
    };
  }

  const subaccountsToDelete =
    params.subaccounts?.filter(
      (subaccount): subaccount is { id: string; delete: true } =>
        'id' in subaccount && 'delete' in subaccount && subaccount.delete === true,
    ) ?? [];

  const newSubaccounts =
    params.subaccounts?.filter(
      (subaccount): subaccount is { name: string; originalCurrency: string } =>
        !('id' in subaccount),
    ) ?? [];

  const existingSubaccounts =
    params.subaccounts?.filter(
      (subaccount): subaccount is { id: string; name?: string; originalCurrency?: string } =>
        'id' in subaccount && !subaccount.delete,
    ) ?? [];

  await db.rls(async (tx) => {
    // Update account
    await tx
      .update(schema.accounts)
      .set({ name: params.name, category: params.category })
      .where(eq(schema.accounts.id, id));

    if (params.subaccounts && params.subaccounts.length) {
      await Promise.all([
        deleteSubaccounts(
          subaccountsToDelete.map((subaccount) => subaccount.id),
          tx,
        ),
        createSubaccounts(
          newSubaccounts.map((subaccount) => ({
            accountId: id,
            name: subaccount.name,
            currency: subaccount.originalCurrency,
          })),
          tx,
        ),
        updateSubaccounts(
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

  // TODO: error handling

  revalidateTag({ tag: CACHE_TAGS.accounts, userId: await getUserId() });
  return { success: true };
}

export async function deleteAccount(accountId: string): Promise<ActionResponse> {
  const db = await getDb();
  await db.rls((tx) => tx.delete(schema.accounts).where(eq(schema.accounts.id, accountId)));

  //TODO: error handling

  revalidateTag({ tag: CACHE_TAGS.accounts, userId: await getUserId() });
  revalidateTag({ tag: CACHE_TAGS.transactions, userId: await getUserId() });
  return { success: true };
}
