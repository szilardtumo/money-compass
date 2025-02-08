'use server';

import { randomUUID } from 'crypto';
import { isToday } from 'date-fns';
import { and, eq, exists, sql } from 'drizzle-orm';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { isGocardlessError, gocardlessApi } from '@/lib/gocardless';
import { GocardlessTransaction } from '@/lib/gocardless/types';
import { ActionResponse } from '@/lib/types/transport.types';
import { getUserId } from '@/server/api/queries/profiles.queries';
import { DbClientTx, getDb, schema } from '@/server/db';
import { isUniqueConstraintError } from '@/server/db/errors';

const DAILY_SYNC_COUNT_LIMIT = 5;

interface CreateGocardlessIntegrationParams {
  institutionId: string;
  redirectUrl: string;
}

/**
 * Creates a new GoCardless integration. The user needs to confirm the integration on the institution's website.
 *
 * @param params Parameters to create the integration.
 * @returns The confirmation URL of the new integration.
 */
export async function createGocardlessIntegration(
  params: CreateGocardlessIntegrationParams,
): Promise<ActionResponse<{ confirmationUrl: string }>> {
  const db = await getDb();
  const integrationId = randomUUID();

  try {
    const requisition = await gocardlessApi.createRequisition({ ...params, integrationId });

    await db.rls(async (tx) => {
      await tx.insert(schema.integrations).values({
        id: integrationId,
        externalId: requisition.id,
        name: requisition.id,
      });
    });

    revalidateTag({ tag: CACHE_TAGS.integrations, userId: await getUserId() });
    return { success: true, data: { confirmationUrl: requisition.link } };
  } catch (err) {
    if (isGocardlessError(err)) {
      // eslint-disable-next-line no-console
      console.error(
        `Gocardless error: ${err.code}: ${err.response.data.detail ?? err.response.data.reference?.detail}`,
      );
      return {
        success: false,
        error: {
          code: err.code,
          message: err.response.data.detail ?? err.response.data.reference?.detail ?? err.code,
        },
      };
    }

    return {
      success: false,
      error: { code: 'unknown', message: err instanceof Error ? err.message : '' },
    };
  }
}

/**
 * Renews an existing GoCardless integration.
 *
 * This function renews an existing GoCardless integration by creating a new requisition
 * with the same details.
 *
 * As GoCardless does not support renewing integrations, a new requisition is created,
 * which needs to be confirmed again by the user on the institution's website.
 *
 * @param integrationId The ID of the integration to renew.
 * @returns The confirmation URL of the new integration.
 */
export async function renewGocardlessIntegration(
  integrationId: string,
): Promise<ActionResponse<{ confirmationUrl: string }>> {
  const db = await getDb();

  try {
    const newRequisition = await db.rls(async (tx) => {
      // Get the integration from the database
      const integration = await tx.query.integrations.findFirst({
        where: (table, { eq }) => eq(table.id, integrationId),
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      // Get the associated requisition from GoCardless
      const oldRequisition = await gocardlessApi.getRequisition(integration.externalId);

      if (!oldRequisition) {
        throw new Error('Requisition not found');
      }

      // Delete the associated requisition from GoCardless
      await gocardlessApi.deleteRequisition(integration.externalId);

      // Create a new requisition in GoCardless with the same details
      const newRequisition = await gocardlessApi.createRequisition({
        institutionId: oldRequisition.institution_id,
        redirectUrl: oldRequisition.redirect,
        integrationId,
      });

      // Update the integration in the database with the new requisition ID
      await tx
        .update(schema.integrations)
        .set({
          externalId: newRequisition.id,
        })
        .where(eq(schema.integrations.id, integrationId));

      return newRequisition;
    });

    return { success: true, data: { confirmationUrl: newRequisition.link } };
  } catch (err) {
    if (isGocardlessError(err)) {
      // eslint-disable-next-line no-console
      console.error(
        `Gocardless error: ${err.code}: ${err.response.data.detail ?? err.response.data.reference?.detail}`,
      );
      return {
        success: false,
        error: {
          code: err.code,
          message: err.response.data.detail ?? err.response.data.reference?.detail ?? err.code,
        },
      };
    }

    return {
      success: false,
      error: { code: 'unknown', message: err instanceof Error ? err.message : '' },
    };
  } finally {
    revalidateTag({ tag: CACHE_TAGS.integrations, userId: await getUserId() });
  }
}

/**
 * Deletes an existing integration.
 *
 * @param id The ID of the integration to delete.
 * @returns
 */
export async function deleteIntegration(id: string): Promise<ActionResponse> {
  const db = await getDb();
  await db.rls(async (tx) => {
    const [deletedIntegration] = await tx
      .delete(schema.integrations)
      .where(eq(schema.integrations.id, id))
      .returning();

    if (deletedIntegration) {
      await gocardlessApi.deleteRequisition(deletedIntegration.externalId);
    }
  });

  revalidateTag({ tag: CACHE_TAGS.integrations, userId: await getUserId() });
  return { success: true };
}

interface LinkIntegrationInput {
  integrationId: string;
  integrationAccountId: string;
  subaccountId: string;
}

export async function linkIntegration(input: LinkIntegrationInput): Promise<ActionResponse> {
  const db = await getDb();

  try {
    await db.rls(async (tx) => {
      // TODO: check if integrationAccountId and subaccountId exist
      await tx.insert(schema.integrationToSubaccounts).values({
        integrationId: input.integrationId,
        subaccountId: input.subaccountId,
        integrationAccountId: input.integrationAccountId,
      });
    });

    revalidateTag({
      tag: CACHE_TAGS.integrations,
      userId: await getUserId(),
      id: input.integrationId,
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return {
        success: false,
        error: {
          code: err.code,
          message: 'This subaccount is already linked to another integration.',
        },
      };
    }

    return {
      success: false,
      error: { code: 'unknown', message: err instanceof Error ? err.message : '' },
    };
  }

  return { success: true };
}

interface UnlinkIntegrationInput {
  integrationId: string;
  integrationAccountId: string;
}

export async function unlinkIntegration(input: UnlinkIntegrationInput): Promise<ActionResponse> {
  const db = await getDb();

  await db.rls(async (tx) => {
    await tx
      .delete(schema.integrationToSubaccounts)
      .where(
        and(
          eq(schema.integrationToSubaccounts.integrationId, input.integrationId),
          eq(schema.integrationToSubaccounts.integrationAccountId, input.integrationAccountId),
        ),
      );
  });

  revalidateTag({
    tag: CACHE_TAGS.integrations,
    userId: await getUserId(),
    id: input.integrationId,
  });

  return { success: true };
}

interface GocardlessTransactionParseResult {
  parsed: Omit<typeof schema.transactions.$inferInsert, 'balance'>[];
  failed: {
    type: string;
    message: string;
    rawTransaction: GocardlessTransaction;
  }[];
}

function _parseTransactionType(types: (string | undefined)[]) {
  if (types.includes('credit')) return 'credit';

  return 'other';
}

function _parseGocardlessTransactions(
  transactions: GocardlessTransaction[],
  subaccount: typeof schema.subaccounts.$inferSelect,
): GocardlessTransactionParseResult {
  return transactions.reduce<GocardlessTransactionParseResult>(
    (acc, transaction) => {
      const rawDate =
        transaction.bookingDateTime ||
        transaction.valueDateTime ||
        transaction.bookingDate ||
        transaction.valueDate ||
        '';
      const date = new Date(rawDate);
      const amount = Number(transaction.transactionAmount.amount);
      const description =
        transaction.remittanceInformationStructured ||
        transaction.remittanceInformationStructuredArray?.join(', ') ||
        transaction.remittanceInformationUnstructured ||
        transaction.remittanceInformationUnstructuredArray?.join(', ') ||
        transaction.creditorName ||
        transaction.debtorName;

      if (isNaN(date.getTime())) {
        acc.failed.push({
          type: 'transactionInvalidDate',
          message: 'Transaction date invalid or missing',
          rawTransaction: transaction,
        });
        return acc;
      }

      if (Number.isNaN(amount)) {
        acc.failed.push({
          type: 'transactionInvalidAmount',
          message: 'Transaction amount invalid',
          rawTransaction: transaction,
        });
        return acc;
      }

      if (transaction.transactionAmount.currency.toLowerCase() !== subaccount.currency) {
        acc.failed.push({
          type: 'transactionInvalidCurrency',
          message: 'Transaction currency invalid',
          rawTransaction: transaction,
        });
        return acc;
      }

      acc.parsed.push({
        externalRef: transaction.transactionId,
        amount,
        startedDate: date,
        completedDate: date,
        description,
        type: _parseTransactionType([
          transaction.bankTransactionCode,
          transaction.proprietaryBankTransactionCode,
        ]),
        counterpartyName: transaction.debtorName || transaction.creditorName,
        subaccountId: subaccount.id,
      });

      return acc;
    },
    { parsed: [], failed: [] },
  );
}

async function _syncIntegrationLink(
  link: typeof schema.integrationToSubaccounts.$inferSelect & {
    subaccount: typeof schema.subaccounts.$inferSelect;
  },
  tx: DbClientTx,
) {
  if (link.lastSyncedAt && isToday(link.lastSyncedAt) && link.syncCount > DAILY_SYNC_COUNT_LIMIT) {
    throw new Error('Too many syncs today');
  }

  try {
    // Get the account balances from GoCardless
    const [integrationTransactions, integrationBalance, [accountBalance]] = await Promise.all([
      gocardlessApi.getTransactions(link.integrationAccountId),
      gocardlessApi.getAccountBalance(link.integrationAccountId),
      tx.select().from(schema.balances).where(eq(schema.balances.subaccountId, link.subaccount.id)),
    ]);

    // Parse the transactions from GoCardless to the internal format
    const { parsed, failed: _failed } = _parseGocardlessTransactions(
      integrationTransactions,
      link.subaccount,
    );

    // TODO: handle failed transactions
    // maybe put them in a separate table and display them on the UI as a warning

    // Filter for the transactions that are newer than the last existing transactions
    // Calculate the balance after each new transaction
    let currentBalance = accountBalance.balance ?? 0;
    const newTransactions = parsed
      .filter((item) => item.startedDate >= accountBalance.lastTransactionDate)
      .toSorted((a, b) => a.startedDate.getTime() - b.startedDate.getTime())
      .map((item) => {
        currentBalance += item.amount;
        return {
          ...item,
          balance: currentBalance,
        } satisfies typeof schema.transactions.$inferInsert;
      });

    // Check if the calculated current balance is the same as the one coming from GoCardless
    // If not, we need to adjust the balance
    const integrationBalanceValue = integrationBalance?.amount
      ? Number(integrationBalance.amount)
      : null;
    if (integrationBalanceValue && Math.abs(integrationBalanceValue - currentBalance) > 0.01) {
      newTransactions.push({
        amount: integrationBalanceValue - currentBalance,
        startedDate: new Date(),
        completedDate: new Date(),
        description: 'Balance adjustment after GoCardless sync',
        type: 'correction',
        subaccountId: link.subaccount.id,
        balance: integrationBalanceValue,
      });
    }

    // Insert the new transactions
    if (newTransactions.length) {
      await tx.insert(schema.transactions).values(newTransactions);
    }
  } catch (err) {
    if (isGocardlessError(err)) {
      // eslint-disable-next-line no-console
      console.error(
        `Gocardless error: ${err.code}: ${err.response.data.detail ?? err.response.data.reference?.detail}`,
      );
    }
    // eslint-disable-next-line no-console
    console.error(
      'Failed to sync transactions for integration account',
      link.integrationAccountId,
      err,
    );
  } finally {
    // Finally, update sync count and last synced at
    await tx
      .update(schema.integrationToSubaccounts)
      .set({
        lastSyncedAt: new Date(),
        syncCount: link.lastSyncedAt && isToday(link.lastSyncedAt) ? link.syncCount + 1 : 1,
      })
      .where(eq(schema.integrationToSubaccounts.integrationAccountId, link.integrationAccountId));
  }
}

async function _syncIntegration(
  integration: typeof schema.integrations.$inferSelect & {
    links: (typeof schema.integrationToSubaccounts.$inferSelect & {
      subaccount: typeof schema.subaccounts.$inferSelect;
    })[];
  },
  tx: DbClientTx,
): Promise<void> {
  // Sync each account one by one
  await Promise.all(integration.links.map((link) => _syncIntegrationLink(link, tx)));
}

/**
 * Syncs a single integration's transactions.
 *
 * @param integrationId The ID of the integration to sync.
 */
export async function syncIntegration(integrationId: string): Promise<ActionResponse> {
  const db = await getDb();
  const userId = await getUserId();

  await db.rls(async (tx) => {
    // Select the integration
    const integration = await tx.query.integrations.findFirst({
      with: { links: { with: { subaccount: true } } },
      where: (table, { eq }) => eq(table.id, integrationId),
    });

    // If the integration doesn't exist, or has no links, there's nothing to sync
    if (!integration || !integration.links.length) {
      return { success: true };
    }

    // Sync the integration
    await _syncIntegration(integration, tx);
  });

  revalidateTag({ tag: CACHE_TAGS.integrations, userId });
  revalidateTag({ tag: CACHE_TAGS.transactions, userId });
  revalidateTag({ tag: CACHE_TAGS.accounts, userId });
  return { success: true };
}

/**
 * Syncs all integrations' transactions.
 */
export async function syncIntegrations(): Promise<ActionResponse> {
  const db = await getDb();
  const userId = await getUserId();

  await db.rls(async (tx) => {
    // Select all integrations which have at least one link to a subaccount
    const integrations = await tx.query.integrations.findMany({
      with: { links: { with: { subaccount: true } } },
      where: exists(
        tx
          .select({ id: sql`1` })
          .from(schema.integrationToSubaccounts)
          .where(eq(schema.integrationToSubaccounts.integrationId, schema.integrations.id)),
      ),
    });

    // Sync each integration one by one
    await Promise.all(integrations.map((integration) => _syncIntegration(integration, tx)));
  });

  revalidateTag({ tag: CACHE_TAGS.integrations, userId });
  revalidateTag({ tag: CACHE_TAGS.transactions, userId });
  revalidateTag({ tag: CACHE_TAGS.accounts, userId });
  return { success: true };
}
