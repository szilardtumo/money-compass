import 'server-only';

import { max, min, startOfDay, subDays } from 'date-fns';
import { and, eq, gte, inArray, isNull, ne, notInArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import * as enableBanking from '@/lib/enable-banking';
import { getMerchantKey } from '@/lib/utils/merchants';
import { assignMerchants } from '@/server/api/merchants/categorize';
import { DbTx, schema } from '@/server/db';

import type { ProviderEntry } from '../providers';

/**
 * Links the two legs of each exchange between the user's subaccounts. The bank gives both legs the
 * same reference, and they can arrive in the syncs of different accounts, so every sync links all
 * unlinked legs.
 */
async function linkTransactions(tx: DbTx, userId: string) {
  const other = alias(schema.transactions, 'other');

  await tx
    .update(schema.transactions)
    .set({ linkedTransactionId: other.id })
    .from(other)
    .where(
      and(
        eq(schema.transactions.userId, userId),
        isNull(schema.transactions.linkedTransactionId),
        eq(other.userId, userId),
        eq(other.externalRef, schema.transactions.externalRef),
        ne(other.subaccountId, schema.transactions.subaccountId),
      ),
    );
}

export const enableBankingProvider = {
  label: 'Enable Banking',
  // PSD2 lets banks refuse more than 4 requests a day made without the user, and a sync makes 2
  dailySyncLimit: 2,
  isRevokedError: (error) =>
    error instanceof enableBanking.EnableBankingError &&
    ['EXPIRED_SESSION', 'CLOSED_SESSION', 'REVOKED_SESSION', 'SESSION_DOES_NOT_EXIST'].includes(
      error.code ?? '',
    ),

  /**
   * Imports the new booked and pending transactions of a linked bank account. Pending transactions
   * get the bank's latest data on each sync, and are deleted once the bank stops returning them. If
   * the balance would still differ from the bank's, a correction transaction goes before the new
   * transactions, so the running balance ends at the bank's balance. Inserts set the user
   * explicitly, because the cron job has no user session.
   */
  sync: async (tx, account) => {
    const { subaccountId } = account;

    // Banks can book a transaction days later with an earlier date, so syncs overlap by 5 days.
    // They never go before the link date: the first correction already covers that period.
    const dateFrom = startOfDay(
      max([account.linkedAt, subDays(account.lastSyncedAt ?? account.linkedAt, 5)]),
    );
    const [bankBalance, bankTransactions] = await Promise.all([
      enableBanking.getBalance(account.externalId),
      enableBanking.getTransactions(account.externalId, dateFrom),
    ]);

    const refs = bankTransactions.map((item) => item.externalRef);
    const isPending = sql<boolean>`${schema.transactions.bankData}->>'status' = 'PDNG'`;

    // The bank reverted these, or booked them under another reference
    await tx
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.subaccountId, subaccountId),
          isPending,
          gte(schema.transactions.startedDate, dateFrom),
          notInArray(schema.transactions.externalRef, refs),
        ),
      );

    const [known, [current]] = await Promise.all([
      refs.length
        ? tx
            .select({
              id: schema.transactions.id,
              externalRef: schema.transactions.externalRef,
              amount: schema.transactions.amount,
              isPending,
            })
            .from(schema.transactions)
            .where(
              and(
                eq(schema.transactions.subaccountId, subaccountId),
                inArray(schema.transactions.externalRef, refs),
              ),
            )
        : [],
      tx
        .select({ balance: schema.balances.balance })
        .from(schema.balances)
        .where(eq(schema.balances.subaccountId, subaccountId)),
    ]);
    const knownByRef = new Map(known.map((row) => [row.externalRef, row]));
    const imported = bankTransactions.filter((item) => !knownByRef.has(item.externalRef));
    // Known pending transactions take the bank's latest data, like the final amount once booked
    const updated = bankTransactions.flatMap((item) => {
      const row = knownByRef.get(item.externalRef);
      return row?.isPending ? [{ ...item, id: row.id, change: item.amount - row.amount }] : [];
    });
    const correction = Number(
      (
        bankBalance -
        (current?.balance ?? 0) -
        imported.reduce((sum, item) => sum + item.amount, 0) -
        updated.reduce((sum, item) => sum + item.change, 0)
      ).toFixed(2),
    );

    // Inserted first, so it sorts before the imported transactions of the same date
    if (correction !== 0) {
      const date = imported.length ? min(imported.map((item) => item.date)) : new Date();
      await tx.insert(schema.transactions).values({
        amount: correction,
        startedDate: date,
        completedDate: date,
        description: 'Balance correction from bank sync',
        type: 'correction',
        dataSource: 'integration',
        subaccountId,
        userId: account.userId,
      });
    }

    if (imported.length) {
      await tx
        .insert(schema.transactions)
        .values(
          imported.map((item) => ({
            externalRef: item.externalRef,
            amount: item.amount,
            startedDate: item.date,
            completedDate: item.completedDate,
            description: item.description,
            counterpartyName: item.counterpartyName,
            type: item.type,
            merchantKey: getMerchantKey(item),
            bankData: item.bankData,
            dataSource: 'integration' as const,
            subaccountId,
            userId: account.userId,
          })),
        )
        .onConflictDoNothing();
    }

    await Promise.all(
      updated.map((item) =>
        tx
          .update(schema.transactions)
          .set({
            amount: item.amount,
            completedDate: item.completedDate,
            type: item.type,
            bankData: item.bankData,
          })
          .where(eq(schema.transactions.id, item.id)),
      ),
    );

    await linkTransactions(tx, account.userId);
    await assignMerchants(tx, account.userId);

    return { importedCount: imported.length, correctionAmount: correction || null };
  },
} satisfies ProviderEntry;
