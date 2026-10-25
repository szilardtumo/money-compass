import 'server-only';

import { eq, sql } from 'drizzle-orm';

import * as enableBanking from '@/lib/enable-banking';
import { getDb, schema } from '@/server/db';

import { getInstitutions } from './queries';

export const AUTH_COOKIE = 'integration_auth';
export const CALLBACK_PATH = '/api/integrations/enable-banking/callback';

/**
 * Creates the session authorized at the bank and saves it with its accounts. When renewing an
 * integration, its accounts keep their links, and the old session is closed.
 *
 * @param code The authorization code the bank redirected with.
 * @param integrationId The integration to renew.
 */
export async function saveSession(code: string, integrationId?: string) {
  const session = await enableBanking.createSession(code);
  const institution = (await getInstitutions()).find(
    (item) =>
      item.name === session.institution.name && item.country === session.institution.country,
  );
  const values = {
    provider: 'enable_banking' as const,
    externalId: session.id,
    institutionName: session.institution.name,
    institutionCountry: session.institution.country,
    institutionLogoUrl: institution?.logoUrl ?? '',
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

    return old?.externalId;
  });

  if (oldSessionId) {
    await enableBanking
      .deleteSession(oldSessionId)
      .catch((error) => console.error('Failed to close the old bank session:', error));
  }
}
