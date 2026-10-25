'use server';

import { addSeconds } from 'date-fns';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { returnValidationErrors } from 'next-safe-action';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { authenticatedActionClient } from '@/lib/api';
import { NotFoundError } from '@/lib/api/errors';
import * as enableBanking from '@/lib/enable-banking';
import {
  setIntegrationAccountLinkSchema,
  startIntegrationAuthSchema,
} from '@/lib/validation/integrations';
import { schema } from '@/server/db';

import { AUTH_COOKIE, CALLBACK_PATH } from './auth';
import { getInstitutions } from './queries';
import { syncAccount } from './sync';

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
    (await cookies()).set(AUTH_COOKIE, JSON.stringify({ state, integrationId }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: CALLBACK_PATH,
      maxAge: 60 * 60,
    });

    const url = await enableBanking.startAuthorization({
      institution: { name: institution.name, country: institution.country },
      validUntil: addSeconds(new Date(), institution.maxConsentSeconds),
      state,
      redirectUrl: new URL(CALLBACK_PATH, (await headers()).get('origin') ?? undefined).href,
    });

    return { url };
  });

export const deleteIntegration = authenticatedActionClient
  .inputSchema(z.uuid())
  .action(async ({ parsedInput: integrationId, ctx }) => {
    const [integration] = await ctx.db.rls((tx) =>
      tx.delete(schema.integrations).where(eq(schema.integrations.id, integrationId)).returning(),
    );

    if (integration) {
      await enableBanking
        .deleteSession(integration.externalId)
        .catch((error) => console.error('Failed to close the bank session:', error));
    }

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Links a bank account to a subaccount with the same currency, or unlinks it.
 * A subaccount can only be linked to one bank account, so it's unlinked from the previous one.
 */
export const setIntegrationAccountLink = authenticatedActionClient
  .inputSchema(setIntegrationAccountLinkSchema)
  .action(async ({ parsedInput: { integrationAccountId, subaccountId }, ctx }) => {
    await ctx.db.rls(async (tx) => {
      if (subaccountId) {
        const [account, subaccount] = await Promise.all([
          tx.query.integrationAccounts.findFirst({
            where: eq(schema.integrationAccounts.id, integrationAccountId),
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
      }

      await tx
        .update(schema.integrationAccounts)
        .set({ subaccountId, linkedAt: subaccountId ? new Date() : null, lastSyncedAt: null })
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
      }),
    );
    if (!account) {
      throw new NotFoundError('bank account', integrationAccountId);
    }

    try {
      await syncAccount(account, ctx.db.rls);
    } finally {
      // A failed sync can mark the integration as revoked
      revalidatePath('/dashboard', 'layout');
    }
  });
