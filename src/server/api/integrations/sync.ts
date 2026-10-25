import 'server-only';

import { isPast, isToday, subDays } from 'date-fns';
import { eq } from 'drizzle-orm';

import { UserError } from '@/lib/api/errors';
import * as enableBanking from '@/lib/enable-banking';
import { Integration, IntegrationAccount } from '@/lib/types/integrations.types';
import { DbClient, schema } from '@/server/db';

// PSD2 lets banks refuse more than 4 requests a day made without the user, and a sync makes 2
export const DAILY_SYNC_LIMIT = 2;

export function getTodaySyncCount(account: IntegrationAccount) {
  return account.lastSyncedAt && isToday(account.lastSyncedAt) ? account.syncCount : 0;
}

/**
 * Imports the booked transactions of a linked bank account, then adds a correction transaction if
 * the balance differs from the bank's. Inserts set the user explicitly, because the cron job has no
 * user session.
 *
 * @param transaction Runs the database writes, with RLS for a user or without it for the cron job.
 */
export async function syncAccount(
  account: IntegrationAccount & { integration: Pick<Integration, 'revokedAt' | 'expiresAt'> },
  transaction: DbClient['rls'],
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

  const [bankBalance, bankTransactions] = await Promise.all([
    enableBanking.getBalance(account.externalId),
    // Banks can book a transaction days later with an earlier date. The first sync starts at
    // the link date, so it doesn't duplicate the transactions entered by hand.
    enableBanking.getTransactions(
      account.externalId,
      account.lastSyncedAt ? subDays(account.lastSyncedAt, 5) : account.linkedAt,
    ),
  ]).catch(async (error) => {
    const sessionEnded =
      error instanceof enableBanking.EnableBankingError &&
      ['EXPIRED_SESSION', 'CLOSED_SESSION', 'REVOKED_SESSION', 'SESSION_DOES_NOT_EXIST'].includes(
        error.code ?? '',
      );
    if (!sessionEnded) {
      throw error;
    }

    await transaction((tx) =>
      tx
        .update(schema.integrations)
        .set({ revokedAt: new Date() })
        .where(eq(schema.integrations.id, account.integrationId)),
    );
    throw new UserError('The access to the bank ended. Renew it to sync again.');
  });

  await transaction(async (tx) => {
    const now = new Date();

    if (bankTransactions.length) {
      await tx
        .insert(schema.transactions)
        .values(
          bankTransactions.map((item) => ({
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

    const [current] = await tx
      .select({ balance: schema.balances.balance })
      .from(schema.balances)
      .where(eq(schema.balances.subaccountId, subaccountId));
    const difference = Number((bankBalance - (current?.balance ?? 0)).toFixed(2));

    if (difference !== 0) {
      await tx.insert(schema.transactions).values({
        amount: difference,
        startedDate: now,
        completedDate: now,
        description: 'Balance correction after bank sync',
        type: 'correction',
        dataSource: 'integration',
        subaccountId,
        userId: account.userId,
      });
    }

    await tx
      .update(schema.integrationAccounts)
      .set({ lastSyncedAt: now, syncCount: syncCount + 1 })
      .where(eq(schema.integrationAccounts.id, account.id));
  });
}
