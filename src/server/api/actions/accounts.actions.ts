'use server';

import { and, eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

import { Enums } from '@/lib/types/database.types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { apiQueries } from '@/server/api/queries';
import { getDb, schema } from '@/server/db';

import { createTransactions } from './transactions.actions';

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

  await db.transaction(async (tx) => {
    const [{ id }] = await tx
      .insert(schema.accounts)
      .values({ name: params.name, category: params.category })
      .returning({ id: schema.accounts.id });

    if (params.subaccounts?.length) {
      await tx.insert(schema.subaccounts).values(
        params.subaccounts.map((subaccount) => ({
          accountId: id,
          currency: subaccount.originalCurrency,
          name: subaccount.name,
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
  subaccounts?: { id: string; name?: string; originalCurrency?: string }[];
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

  const currencyChangeItems =
    params.subaccounts
      ?.map((subaccount) => ({
        subaccount,
        prevSubaccount: account.subaccounts.find((item) => item.id === subaccount.id),
      }))
      .filter(
        ({ subaccount, prevSubaccount }) =>
          prevSubaccount &&
          subaccount.originalCurrency &&
          subaccount.originalCurrency !== prevSubaccount.originalCurrency,
      ) ?? [];

  await db.transaction(async (tx) => {
    // Update account
    await tx
      .update(schema.accounts)
      .set({ name: params.name, category: params.category })
      .where(eq(schema.accounts.id, id));

    if (params.subaccounts && params.subaccounts.length) {
      await Promise.all([
        // Update subaccounts
        ...params.subaccounts!.map((subaccount) =>
          tx
            .update(schema.subaccounts)
            .set({ name: subaccount.name, currency: subaccount.originalCurrency })
            .where(eq(schema.subaccounts.id, subaccount.id)),
        ),
        // Update transactions where the subaccount's currency changed
        ...currencyChangeItems.map(({ subaccount, prevSubaccount }) => {
          const rate = tx.$with('rate').as(
            db
              .select({ rate: schema.exchangeRates.rate })
              .from(schema.exchangeRates)
              .where(
                and(
                  eq(schema.exchangeRates.from, prevSubaccount!.originalCurrency),
                  eq(schema.exchangeRates.to, subaccount.originalCurrency!),
                ),
              ),
          );

          return tx
            .with(rate)
            .update(schema.transactions)
            .set({
              amount: sql`${schema.transactions.amount} * ${rate}`,
              balance: sql`${schema.transactions.balance} * ${rate}`,
            })
            .where(eq(schema.transactions.subaccountId, subaccount.id));
        }),
      ]);
    }
  });

  // TODO: error handling

  if (currencyChangeItems.length) {
    revalidateTag('transactions');
  }
  revalidateTag('accounts');
  revalidateTag('subaccounts');
  return { success: true };
}

export async function deleteAccount(accountId: string): Promise<ActionResponse> {
  const db = await getDb();
  await db.transaction((tx) => tx.delete(schema.accounts).where(eq(schema.accounts.id, accountId)));

  //TODO: error handling

  revalidateTag('accounts');
  revalidateTag('subaccounts');
  revalidateTag('transactions');
  return { success: true };
}

export async function updateAccountBalances(
  balances: Record<string, number>,
): Promise<ActionResponse> {
  const subaccountBalances = await apiQueries.accounts.getSubaccountBalances();
  const now = new Date().toISOString();

  const transactions: Parameters<typeof createTransactions>[0] = Object.entries(balances)
    .map(([subaccountId, balance]) => ({
      subaccountId,
      amount: balance - (subaccountBalances[subaccountId] ?? 0),
      type: 'correction' as const,
      description: 'Manual balance correction',
      date: now,
    }))
    .filter((transaction) => transaction.amount !== 0);

  return createTransactions(transactions);
}
