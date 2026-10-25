import 'server-only';

import { isPast, isToday, max, min, subDays } from 'date-fns';
import { and, eq, inArray } from 'drizzle-orm';

import { UserError } from '@/lib/api/errors';
import * as enableBanking from '@/lib/enable-banking';
import { Integration, IntegrationAccount } from '@/lib/types/integrations.types';
import { DbClient, DbTx, schema } from '@/server/db';

// PSD2 lets banks refuse more than 4 requests a day made without the user, and a sync makes 2
export const DAILY_SYNC_LIMIT = 2;

export function getTodaySyncCount(account: IntegrationAccount) {
  return account.lastSyncedAt && isToday(account.lastSyncedAt) ? account.syncCount : 0;
}

/**
 * Imports the new booked transactions of a linked bank account. If the balance would still differ
 * from the bank's, a correction transaction goes before them, so the running balance ends at the
 * bank's balance. Each sync that reaches the bank is logged. Inserts set the user explicitly,
 * because the cron job has no user session.
 *
 * @param transaction Runs the database writes, with RLS for a user or without it for the cron job.
 */
export async function syncAccount(
  account: IntegrationAccount & { integration: Pick<Integration, 'revokedAt' | 'expiresAt'> },
  transaction: DbClient['rls'],
  trigger: 'manual' | 'cron',
) {
  const { subaccountId } = account;
  if (!subaccountId || !account.linkedAt) {
    throw new UserError('The bank account is not linked to a subaccount.');
  }
  if (account.integration.revokedAt || isPast(account.integration.expiresAt)) {
    throw new UserError('The access to the bank ended. Renew it to sync again.');
  }

  const syncCount = getTodaySyncCount(account);
  if (syncCount >= DAILY_SYNC_LIMIT) {
    throw new UserError(`The bank account was already synced ${DAILY_SYNC_LIMIT} times today.`);
  }

  const log = (tx: DbTx, values: Partial<typeof schema.integrationSyncLogs.$inferInsert>) =>
    tx
      .insert(schema.integrationSyncLogs)
      .values({ accountId: account.id, userId: account.userId, trigger, ...values });

  const [bankBalance, bankTransactions] = await Promise.all([
    enableBanking.getBalance(account.externalId),
    // Banks can book a transaction days later with an earlier date, so syncs overlap by 5 days.
    // They never go before the link date: the first correction already covers that period.
    enableBanking.getTransactions(
      account.externalId,
      max([account.linkedAt, subDays(account.lastSyncedAt ?? account.linkedAt, 5)]),
    ),
  ]).catch(async (error) => {
    const sessionEnded =
      error instanceof enableBanking.EnableBankingError &&
      ['EXPIRED_SESSION', 'CLOSED_SESSION', 'REVOKED_SESSION', 'SESSION_DOES_NOT_EXIST'].includes(
        error.code ?? '',
      );

    await transaction(async (tx) => {
      await log(tx, { error: error instanceof Error ? error.message : String(error) });
      if (sessionEnded) {
        await tx
          .update(schema.integrations)
          .set({ revokedAt: new Date() })
          .where(eq(schema.integrations.id, account.integrationId));
      }
    });
    throw sessionEnded
      ? new UserError('The access to the bank ended. Renew it to sync again.')
      : error;
  });

  await transaction(async (tx) => {
    const now = new Date();
    const refs = bankTransactions.flatMap((item) => item.externalRef ?? []);
    const [known, [current]] = await Promise.all([
      refs.length
        ? tx
            .select({ externalRef: schema.transactions.externalRef })
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
    const knownRefs = new Set(known.map((item) => item.externalRef));
    const imported = bankTransactions.filter(
      (item) => !item.externalRef || !knownRefs.has(item.externalRef),
    );
    const correction = Number(
      (
        bankBalance -
        (current?.balance ?? 0) -
        imported.reduce((sum, item) => sum + item.amount, 0)
      ).toFixed(2),
    );

    // Inserted first, so it sorts before the imported transactions of the same date
    if (correction !== 0) {
      const date = imported.length ? min(imported.map((item) => item.date)) : now;
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
            completedDate: item.date,
            description: item.description,
            counterpartyName: item.counterpartyName,
            type: 'other',
            dataSource: 'integration' as const,
            subaccountId,
            userId: account.userId,
          })),
        )
        .onConflictDoNothing();
    }

    await tx
      .update(schema.integrationAccounts)
      .set({ lastSyncedAt: now, syncCount: syncCount + 1 })
      .where(eq(schema.integrationAccounts.id, account.id));
    await log(tx, { importedCount: imported.length, correctionAmount: correction || null });
  });
}
