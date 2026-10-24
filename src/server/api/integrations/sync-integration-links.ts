import 'server-only';

import { isToday } from 'date-fns';
import { eq, exists, sql } from 'drizzle-orm';

import { CACHE_TAGS, revalidateTag } from '@/lib/api/cache';
import { DAILY_SYNC_COUNT_LIMIT } from '@/lib/constants/integrations';
import { gocardlessApi, isGocardlessError } from '@/lib/gocardless';
import { GocardlessTransaction } from '@/lib/gocardless/types';
import { ActionResponse } from '@/lib/types/transport.types';
import { DbClientTx, getAdminDb, schema } from '@/server/db';

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

export async function syncIntegrationLinkTransactions(
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
      { cause: err },
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

/**
 * Syncs all integrations' transactions.
 *
 * This bypasses RLS and should only be used in cron jobs.
 */
export async function adminSyncAllIntegrations(): Promise<ActionResponse> {
  const db = await getAdminDb();

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
        integration.links.map((link) => syncIntegrationLinkTransactions(link, tx)),
      ),
    );
  });

  revalidateTag({ tag: CACHE_TAGS.integrations });
  revalidateTag({ tag: CACHE_TAGS.transactions });
  revalidateTag({ tag: CACHE_TAGS.accounts });
  return { success: true };
}
