import 'server-only';

import { and, eq, notInArray, sql } from 'drizzle-orm';
import { after } from 'next/server';

import * as enableBanking from '@/lib/enable-banking';
import { getDb, schema } from '@/server/db';

export const AUTH_COOKIE = 'integration_auth';
export const CALLBACK_PATH = '/api/integrations/enable-banking/callback';

/**
 * Creates the session authorized at the bank and saves it with its accounts. When renewing an
 * integration, its accounts keep their links, and the old session is closed.
 */
export async function saveSession(
  code: string,
  { integrationId, logoUrl }: { integrationId?: string; logoUrl?: string },
) {
  const session = await enableBanking.createSession(code);
  const values = {
    provider: 'enable_banking' as const,
    externalId: session.id,
    institutionName: session.institution.name,
    institutionCountry: session.institution.country,
    institutionLogoUrl: logoUrl ?? '',
    expiresAt: session.expiresAt,
    revokedAt: null,
  };

  const db = await getDb();
  const oldSessionId = await db.rls(async (tx) => {
    const old = integrationId
      ? await tx.query.integrations.findFirst({ where: eq(schema.integrations.id, integrationId) })
      : undefined;

    const [integration] = old
      ? await tx
          .update(schema.integrations)
          .set(values)
          .where(eq(schema.integrations.id, old.id))
          .returning()
      : await tx.insert(schema.integrations).values(values).returning();

    if (session.accounts.length) {
      await tx
        .insert(schema.integrationAccounts)
        .values(session.accounts.map((account) => ({ ...account, integrationId: integration.id })))
        .onConflictDoUpdate({
          target: [
            schema.integrationAccounts.integrationId,
            schema.integrationAccounts.identificationHash,
          ],
          set: {
            externalId: sql`excluded.external_id`,
            name: sql`excluded.name`,
            iban: sql`excluded.iban`,
            currency: sql`excluded.currency`,
          },
        });
    }

    // The bank stopped sharing these accounts, so their IDs don't work with the new session
    await tx.delete(schema.integrationAccounts).where(
      and(
        eq(schema.integrationAccounts.integrationId, integration.id),
        session.accounts.length
          ? notInArray(
              schema.integrationAccounts.identificationHash,
              session.accounts.map((account) => account.identificationHash),
            )
          : undefined,
      ),
    );

    return old?.externalId;
  });

  if (oldSessionId) {
    after(() =>
      enableBanking
        .deleteSession(oldSessionId)
        .catch((error) => console.error('Failed to close the old bank session:', error)),
    );
  }
}
