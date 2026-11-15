'use server';

import { addSeconds, subDays } from 'date-fns';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { after } from 'next/server';
import { returnValidationErrors } from 'next-safe-action';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { authenticatedActionClient } from '@/lib/api';
import { NotFoundError, UserError } from '@/lib/api/errors';
import { encryptSecret } from '@/lib/crypto';
import * as enableBanking from '@/lib/enable-banking';
import { fetchFlexStatement, IbkrFlexError } from '@/lib/ibkr-flex';
import {
  connectIbkrSchema,
  setIntegrationAccountLinkSchema,
  startIntegrationAuthSchema,
} from '@/lib/validation/integrations';
import { schema } from '@/server/db';

import { AUTH_COOKIE, CALLBACK_PATH } from './auth';
import { IbkrCredentials, getIbkrIdentificationHash } from './providers/ibkr-flex';
import { getInstitutions } from './queries';
import { syncAccount } from './sync';
import { enrichMerchants } from '../merchants/categorize';

/**
 * Starts connecting a bank, or renewing the access of an integration.
 * The bank redirects to the callback route, which saves the integration.
 *
 * @returns The URL of the bank's authorization page.
 */
export const startIntegrationAuth = authenticatedActionClient
  .inputSchema(startIntegrationAuthSchema)
  .action(async ({ parsedInput: { institution: selected, integrationId } }) => {
    const institution = (await getInstitutions()).find(
      (item) => item.name === selected.name && item.country === selected.country,
    );
    if (!institution) {
      returnValidationErrors(startIntegrationAuthSchema, {
        institution: { _errors: ['Bank not found.'] },
      });
    }

    const state = randomUUID();
    (await cookies()).set(
      AUTH_COOKIE,
      JSON.stringify({ state, integrationId, logoUrl: institution.logoUrl }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: CALLBACK_PATH,
        maxAge: 60 * 60,
      },
    );

    const url = await enableBanking.startAuthorization({
      institution: selected,
      validUntil: addSeconds(new Date(), institution.maxConsentSeconds),
      state,
      redirectUrl: new URL(CALLBACK_PATH, (await headers()).get('origin') ?? undefined).href,
    });

    return { url };
  });

/**
 * Connects IBKR accounts through an Activity Flex query. A week's statement proves that the token
 * and the query work, and its Cash Report lists the currencies to link. Connecting the same query
 * again renews its token, and its accounts keep their links.
 */
export const connectIbkr = authenticatedActionClient
  .inputSchema(connectIbkrSchema)
  .action(async ({ parsedInput: { token, queryId, expiresAt }, ctx }) => {
    const credentials = encryptSecret(JSON.stringify({ token, queryId } satisfies IbkrCredentials));
    const now = new Date();
    const statements = await fetchFlexStatement(token, queryId, {
      from: subDays(now, 6),
      to: now,
    }).catch((error) => {
      throw error instanceof IbkrFlexError ? new UserError(error.message) : error;
    });

    await ctx.db.rls(async (tx) => {
      const [integration] = await tx
        .insert(schema.integrations)
        .values({
          provider: 'ibkr_flex',
          externalId: queryId,
          institutionName: 'Interactive Brokers',
          institutionCountry: 'IE',
          institutionLogoUrl: '',
          expiresAt,
          credentials,
        })
        .onConflictDoUpdate({
          target: schema.integrations.externalId,
          set: { expiresAt, credentials, revokedAt: null },
        })
        .returning();

      const accounts = statements.flatMap((statement) =>
        Object.keys(statement.endingCash).map((currency) => ({
          integrationId: integration.id,
          externalId: statement.accountId,
          identificationHash: getIbkrIdentificationHash(statement.accountId, currency),
          name: statement.accountId,
          currency,
        })),
      );
      if (accounts.length) {
        await tx.insert(schema.integrationAccounts).values(accounts).onConflictDoNothing();
      }
    });

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Creates an investment account for each IBKR account of the integration, with a subaccount per
 * unlinked currency, and links them.
 */
export const createInvestmentAccounts = authenticatedActionClient
  .inputSchema(z.uuid())
  .action(async ({ parsedInput: integrationId, ctx }) => {
    await ctx.db.rls(async (tx) => {
      const [unlinked, currencies] = await Promise.all([
        tx.query.integrationAccounts.findMany({
          where: and(
            eq(schema.integrationAccounts.integrationId, integrationId),
            isNull(schema.integrationAccounts.subaccountId),
          ),
        }),
        tx.select({ id: schema.currencies.id }).from(schema.currencies),
      ]);
      // Subaccounts can only have the app's currencies
      const supported = new Set(currencies.map((currency) => currency.id));
      const accounts = Map.groupBy(
        unlinked.filter((account) => supported.has(account.currency)),
        (account) => account.externalId,
      );
      if (!accounts.size) {
        throw new UserError('Every IBKR currency the app supports is already linked.');
      }

      for (const items of accounts.values()) {
        const [{ id: accountId }] = await tx
          .insert(schema.accounts)
          .values({ name: 'Interactive Brokers', category: 'investment' })
          .returning({ id: schema.accounts.id });
        const subaccounts = await tx
          .insert(schema.subaccounts)
          .values(
            items.map((item) => ({
              accountId,
              name: item.currency.toUpperCase(),
              currency: item.currency,
            })),
          )
          .returning();

        await Promise.all(
          items.map((item) =>
            tx
              .update(schema.integrationAccounts)
              .set({
                subaccountId: subaccounts.find(
                  (subaccount) => subaccount.currency === item.currency,
                )!.id,
                linkedAt: new Date(),
                syncedFrom: null,
              })
              .where(eq(schema.integrationAccounts.id, item.id)),
          ),
        );
      }
    });

    revalidatePath('/dashboard', 'layout');
  });

export const deleteIntegration = authenticatedActionClient
  .inputSchema(z.uuid())
  .action(async ({ parsedInput: integrationId, ctx }) => {
    const [integration] = await ctx.db.rls((tx) =>
      tx.delete(schema.integrations).where(eq(schema.integrations.id, integrationId)).returning(),
    );

    if (integration?.provider === 'enable_banking') {
      after(() =>
        enableBanking
          .deleteSession(integration.externalId)
          .catch((error) => console.error('Failed to close the bank session:', error)),
      );
    }

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Links a bank account to a subaccount with the same currency, or unlinks it.
 * A subaccount can only be linked to one bank account, so it's unlinked from the previous one.
 * Linking an IBKR account deletes the subaccount's corrections, because the IBKR history replaces
 * them, and the next sync imports the history again.
 */
export const setIntegrationAccountLink = authenticatedActionClient
  .inputSchema(setIntegrationAccountLinkSchema)
  .action(async ({ parsedInput: { integrationAccountId, subaccountId }, ctx }) => {
    await ctx.db.rls(async (tx) => {
      if (subaccountId) {
        const [account, subaccount] = await Promise.all([
          tx.query.integrationAccounts.findFirst({
            where: eq(schema.integrationAccounts.id, integrationAccountId),
            with: { integration: { columns: { provider: true } } },
          }),
          tx.query.subaccounts.findFirst({ where: eq(schema.subaccounts.id, subaccountId) }),
        ]);

        if (!account || account.currency !== subaccount?.currency) {
          returnValidationErrors(setIntegrationAccountLinkSchema, {
            subaccountId: {
              _errors: ['The subaccount must have the same currency as the bank account.'],
            },
          });
        }

        await tx
          .update(schema.integrationAccounts)
          .set({ subaccountId: null, linkedAt: null })
          .where(eq(schema.integrationAccounts.subaccountId, subaccountId));

        if (account.integration.provider === 'ibkr_flex') {
          await tx
            .delete(schema.transactions)
            .where(
              and(
                eq(schema.transactions.subaccountId, subaccountId),
                eq(schema.transactions.type, 'correction'),
              ),
            );
        }
      }

      await tx
        .update(schema.integrationAccounts)
        .set({ subaccountId, linkedAt: subaccountId ? new Date() : null, syncedFrom: null })
        .where(eq(schema.integrationAccounts.id, integrationAccountId));
    });

    revalidatePath('/dashboard', 'layout');
  });

export const syncIntegrationAccount = authenticatedActionClient
  .inputSchema(z.uuid())
  .action(async ({ parsedInput: integrationAccountId, ctx }) => {
    const account = await ctx.db.rls((tx) =>
      tx.query.integrationAccounts.findFirst({
        where: eq(schema.integrationAccounts.id, integrationAccountId),
        with: { integration: true },
      }),
    );
    if (!account) {
      throw new NotFoundError('bank account', integrationAccountId);
    }

    try {
      await syncAccount(account, ctx.db.rls, 'manual');
      // The LLM can take minutes, the new merchants get their categories by the next page load
      after(() => enrichMerchants(ctx.db.rls, ctx.userId));
    } finally {
      // A failed sync can mark the integration as revoked
      revalidatePath('/dashboard', 'layout');
    }
  });
