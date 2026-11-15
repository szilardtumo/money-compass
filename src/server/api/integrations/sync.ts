import 'server-only';

import { isPast, isToday } from 'date-fns';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { UserError } from '@/lib/api/errors';
import { IntegrationAccount } from '@/lib/types/integrations.types';
import { DbClient, DbTx, schema } from '@/server/db';

import { integrationProviders } from './providers';

/**
 * Inserts a correction, so the subaccount's balance ends at `target` once the `pending` amount of the
 * transactions about to be inserted is added. Inserted first, it sorts before the new transactions
 * of the same date. Inserts set the user explicitly, because the cron job has no user session.
 *
 * @returns The correction, or null when the balance already matches.
 */
export async function insertBalanceCorrection(
  tx: DbTx,
  params: {
    subaccountId: string;
    userId: string;
    target: number;
    pending: number;
    date: Date;
    description: string;
  },
) {
  const [current] = await tx
    .select({ balance: schema.balances.balance })
    .from(schema.balances)
    .where(eq(schema.balances.subaccountId, params.subaccountId));
  const amount = Number((params.target - (current?.balance ?? 0) - params.pending).toFixed(2));

  if (amount !== 0) {
    await tx.insert(schema.transactions).values({
      amount,
      startedDate: params.date,
      completedDate: params.date,
      description: params.description,
      type: 'correction',
      dataSource: 'integration',
      subaccountId: params.subaccountId,
      userId: params.userId,
    });
  }

  return amount || null;
}

/**
 * Links the two legs of each exchange between the user's subaccounts. The provider gives both legs
 * the same reference, and they can arrive in the syncs of different accounts, so every sync links
 * all unlinked legs.
 */
export async function linkTransactions(tx: DbTx, userId: string) {
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

export function getTodaySyncCount(account: IntegrationAccount) {
  return account.lastSyncedAt && isToday(account.lastSyncedAt) ? account.syncCount : 0;
}

/**
 * Syncs a linked account through its integration's provider. Every sync that passes the checks is
 * logged, failed ones too. A provider error that means the access ended revokes the integration.
 *
 * @param transaction Runs the database writes, with RLS for a user or without it for the cron job.
 */
export async function syncAccount(
  account: IntegrationAccount & {
    integration: Pick<
      typeof schema.integrations.$inferSelect,
      'provider' | 'revokedAt' | 'expiresAt' | 'credentials'
    >;
  },
  transaction: DbClient['rls'],
  trigger: 'manual' | 'cron',
) {
  const { subaccountId, linkedAt } = account;
  if (!subaccountId || !linkedAt) {
    throw new UserError('The bank account is not linked to a subaccount.');
  }
  if (account.integration.revokedAt || isPast(account.integration.expiresAt)) {
    throw new UserError('The access to the bank ended. Renew it to sync again.');
  }

  const provider = integrationProviders[account.integration.provider];
  const syncCount = getTodaySyncCount(account);
  if (syncCount >= provider.dailySyncLimit) {
    throw new UserError(
      `The bank account was already synced ${provider.dailySyncLimit} times today.`,
    );
  }

  const log = (tx: DbTx, values: Partial<typeof schema.integrationSyncLogs.$inferInsert>) =>
    tx
      .insert(schema.integrationSyncLogs)
      .values({ accountId: account.id, userId: account.userId, trigger, ...values });

  try {
    const write = await provider.sync({ ...account, subaccountId, linkedAt });
    await transaction(async (tx) => {
      // Waits for a concurrent sync of the account, so the writes below see its correction
      await tx
        .select({ id: schema.integrationAccounts.id })
        .from(schema.integrationAccounts)
        .where(eq(schema.integrationAccounts.id, account.id))
        .for('update');

      const result = await write(tx);

      await tx
        .update(schema.integrationAccounts)
        .set({ lastSyncedAt: new Date(), syncCount: syncCount + 1 })
        .where(eq(schema.integrationAccounts.id, account.id));
      await log(tx, result);
    });
  } catch (error) {
    const revoked = provider.isRevokedError(error);
    await transaction(async (tx) => {
      await log(tx, { error: error instanceof Error ? error.message : String(error) });
      if (revoked) {
        await tx
          .update(schema.integrations)
          .set({ revokedAt: new Date() })
          .where(eq(schema.integrations.id, account.integrationId));
      }
    });
    throw revoked ? new UserError('The access to the bank ended. Renew it to sync again.') : error;
  }
}
