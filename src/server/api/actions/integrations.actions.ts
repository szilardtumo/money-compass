'use server';

import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { isGocardlessError, gocardlessApi } from '@/lib/gocardless';
import { ActionResponse } from '@/lib/types/transport.types';
import { getUserId } from '@/server/api/queries/profiles.queries';
import { getDb, schema } from '@/server/db';

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
      console.error(`Gocardless error: ${err.code}: ${err.response.data.reference.detail}`);
      return {
        success: false,
        error: { code: err.code, message: err.response.data.reference.detail },
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
      console.error(`Gocardless error: ${err.code}: ${err.response.data.reference.detail}`);
      return {
        success: false,
        error: { code: err.code, message: err.response.data.reference.detail },
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
