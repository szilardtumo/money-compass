'use server';

import { isBefore, max } from 'date-fns';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { formatDate } from '@/lib/utils/formatters';
import { apiQueries } from '@/server/api/queries';
import { getDb, schema } from '@/server/db';

import { createTransactions } from './transactions.actions';

interface CreateSubaccountParams {
  accountId: string;
  name: string;
  currency: string;
}

/**
 * Creates new subaccounts
 *
 * @param params A list of parameters to create the subaccounts.
 * @returns
 */
async function createSubaccounts(params: CreateSubaccountParams[]): Promise<ActionResponse> {
  if (!params.length) {
    return { success: true };
  }

  const db = await getDb();

  await db.rls(async (tx) => {
    await tx.insert(schema.subaccounts).values(
      params.map((item) => ({
        accountId: item.accountId,
        name: item.name,
        currency: item.currency,
      })),
    );
  });

  // TODO: error handling

  revalidateTag('accounts');
  revalidateTag('subaccounts');
  return { success: true };
}

/**
 * Deletes subaccounts with the specified ids
 *
 * @param subaccountIds A list of subaccount ids
 * @returns
 */
async function deleteSubaccounts(subaccountIds: string[]): Promise<ActionResponse> {
  const db = await getDb();

  await db.rls(async (tx) => {
    await tx.delete(schema.subaccounts).where(inArray(schema.subaccounts.id, subaccountIds));
  });

  // TODO: error handling

  revalidateTag('accounts');
  revalidateTag('subaccounts');
  return { success: true };
}

interface UpdateSubaccountParams {
  id: string;
  name?: string;
  currency?: string;
}

async function updateSubaccounts(params: UpdateSubaccountParams[]): Promise<ActionResponse> {
  const db = await getDb();

  const wasCurrencyChanged = await db.rls(async (tx) => {
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
            prevSubaccount &&
            subaccount.currency &&
            subaccount.currency !== prevSubaccount.currency,
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
              eq(schema.exchangeRates.from, prevSubaccount!.currency),
              eq(schema.exchangeRates.to, subaccount.currency!),
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

    return !!currencyChangeSubaccounts.length;
  });

  // TODO: error handling

  if (wasCurrencyChanged) {
    revalidateTag('transactions');
  }
  revalidateTag('accounts');
  revalidateTag('subaccounts');
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

  await db.rls(async (tx) => {
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
      );
    }
  });

  // TODO: error handling

  revalidateTag('accounts');
  revalidateTag('subaccounts');
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
        deleteSubaccounts(subaccountsToDelete.map((subaccount) => subaccount.id)),
        createSubaccounts(
          newSubaccounts.map((subaccount) => ({
            accountId: id,
            name: subaccount.name,
            currency: subaccount.originalCurrency,
          })),
        ),
        updateSubaccounts(
          existingSubaccounts.map((subaccount) => ({
            id: subaccount.id,
            name: subaccount.name,
            currency: subaccount.originalCurrency,
          })),
        ),
      ]);
    }
  });

  // TODO: error handling

  revalidateTag('accounts');
  revalidateTag('subaccounts');
  return { success: true };
}

export async function deleteAccount(accountId: string): Promise<ActionResponse> {
  const db = await getDb();
  await db.rls((tx) => tx.delete(schema.accounts).where(eq(schema.accounts.id, accountId)));

  //TODO: error handling

  revalidateTag('accounts');
  revalidateTag('subaccounts');
  revalidateTag('transactions');
  return { success: true };
}

interface UpdateAccountBalancesParams {
  balances: Record<string, number>;
  description: string;
  date: Date;
}

export async function updateAccountBalances({
  balances,
  description,
  date,
}: UpdateAccountBalancesParams): Promise<ActionResponse> {
  const subaccountBalances = await apiQueries.accounts.getSubaccountBalances();

  const transactions: Parameters<typeof createTransactions>[0] = Object.entries(balances)
    .map(([subaccountId, balance]) => ({
      subaccountId,
      amount: balance - (subaccountBalances[subaccountId]?.balance ?? 0),
      type: 'correction' as const,
      description,
      date,
    }))
    .filter((transaction) => transaction.amount !== 0);

  if (
    transactions.some((transaction) =>
      isBefore(transaction.date, subaccountBalances[transaction.subaccountId]?.lastTransactionDate),
    )
  ) {
    const lastTransactionDate = max(
      transactions.map(
        (transaction) => subaccountBalances[transaction.subaccountId]?.lastTransactionDate,
      ),
    );

    return {
      success: false,
      error: {
        code: ActionErrorCode.ValidationError,
        message: `The transaction date can't be before the latest already existing transaction from the updated subaccounts. Earliest possible date is: ${formatDate(lastTransactionDate)}`,
      },
    };
  }

  return createTransactions(transactions);
}
