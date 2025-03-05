'use server';

import { isToday } from 'date-fns';
import { eq, exists, sql } from 'drizzle-orm';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { DAILY_SYNC_COUNT_LIMIT } from '@/lib/constants/integrations';
import { isGocardlessError, gocardlessApi } from '@/lib/gocardless';
import { GocardlessTransaction } from '@/lib/gocardless/types';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { getUserId } from '@/server/api/queries/profiles.queries';
import { DbClientTx, getDb, schema } from '@/server/db';
import { isUniqueConstraintError } from '@/server/db/errors';

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
      await tx.insert(schema.integrationLinks).values({
        integrationId: input.integrationId,
        subaccountId: input.subaccountId,
        integrationAccountId: input.integrationAccountId,
      });
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return {
        success: false,
        error: {
          code: ActionErrorCode.UniqueViolation,
          message: 'This subaccount is already linked to another integration.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: ActionErrorCode.Unknown,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    };
  }

  revalidateTag({
    tag: CACHE_TAGS.integrations,
    userId: await getUserId(),
    id: input.integrationId,
  });

  return { success: true };
}

export async function unlinkIntegration(linkId: string): Promise<ActionResponse> {
  const db = await getDb();

  const [link] = await db.rls(async (tx) =>
    tx.delete(schema.integrationLinks).where(eq(schema.integrationLinks.id, linkId)).returning(),
  );

  if (link) {
    revalidateTag({
      tag: CACHE_TAGS.integrations,
      userId: await getUserId(),
      id: link.integrationId,
    });
  }

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
        dataSource: 'integration',
        subaccountId: subaccount.id,
      });

      return acc;
    },
    { parsed: [], failed: [] },
  );
}

async function _syncIntegrationLink(
  link: typeof schema.integrationLinks.$inferSelect & {
    subaccount: typeof schema.subaccounts.$inferSelect;
  },
  tx: DbClientTx,
) {
  if (link.lastSyncedAt && isToday(link.lastSyncedAt) && link.syncCount > DAILY_SYNC_COUNT_LIMIT) {
    throw new Error('Too many syncs today');
  }

  try {
    // Get the account balances from GoCardless
    const [integrationTransactions, integrationBalance, [accountBalance = null]] =
      await Promise.all([
        gocardlessApi.getTransactions(link.integrationAccountId),
        gocardlessApi.getAccountBalance(link.integrationAccountId),
        tx
          .select()
          .from(schema.balances)
          .where(eq(schema.balances.subaccountId, link.subaccount.id)),
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
    let currentBalance = accountBalance?.balance ?? 0;
    const newTransactions = parsed
      .filter((item) => !accountBalance || item.startedDate >= accountBalance.lastTransactionDate)
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
      console.error(
        `Gocardless error: ${err.code}: ${err.response.data.detail ?? err.response.data.reference?.detail}`,
      );
    }

    throw new Error(
      `Failed to sync transactions for integration account ${link.integrationAccountId}`,
    );
  } finally {
    // Finally, update sync count and last synced at
    await tx
      .update(schema.integrationLinks)
      .set({
        lastSyncedAt: new Date(),
        syncCount: link.lastSyncedAt && isToday(link.lastSyncedAt) ? link.syncCount + 1 : 1,
      })
      .where(eq(schema.integrationLinks.integrationAccountId, link.integrationAccountId));
  }
}

export async function syncIntegrationLink(linkId: string): Promise<ActionResponse> {
  const db = await getDb();
  const userId = await getUserId();

  const response = await db.rls(async (tx): Promise<ActionResponse> => {
    const link = await tx.query.integrationLinks.findFirst({
      where: (table, { eq }) => eq(table.id, linkId),
      with: { subaccount: true },
    });

    if (!link) {
      return {
        success: false,
        error: { code: ActionErrorCode.NotFound, message: 'Link not found' },
      };
    }

    try {
      await _syncIntegrationLink(link, tx);
    } catch (err) {
      return {
        success: false,
        error: {
          code: ActionErrorCode.Unknown,
          message: err instanceof Error ? err.message : 'Unknown error',
        },
      };
    }

    return { success: true };
  });

  revalidateTag({ tag: CACHE_TAGS.transactions, userId });
  revalidateTag({ tag: CACHE_TAGS.integrations, userId });
  revalidateTag({ tag: CACHE_TAGS.accounts, userId });
  return response;
}

/**
 * Syncs all integrations' transactions.
 *
 * This bypasses RLS and should only be used in cron jobs.
 */
export async function adminSyncAllIntegrations(): Promise<ActionResponse> {
  const db = await getDb();

  await db.admin.transaction(async (tx) => {
    // Select all integrations which have at least one link to a subaccount
    const integrations = await tx.query.integrations.findMany({
      with: { links: { with: { subaccount: true } } },
      where: exists(
        tx
          .select({ id: sql`1` })
          .from(schema.integrationLinks)
          .where(eq(schema.integrationLinks.integrationId, schema.integrations.id)),
      ),
    });

    // Sync each integration one by one
    await Promise.allSettled(
      integrations.flatMap((integration) =>
        integration.links.map((link) => _syncIntegrationLink(link, tx)),
      ),
    );
  });

  revalidateTag({ tag: CACHE_TAGS.integrations });
  revalidateTag({ tag: CACHE_TAGS.transactions });
  revalidateTag({ tag: CACHE_TAGS.accounts });
  return { success: true };
}
