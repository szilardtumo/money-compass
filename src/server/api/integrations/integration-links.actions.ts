'use server';

import { eq } from 'drizzle-orm';

import { CACHE_TAGS, updateTag } from '@/lib/api/cache';
import { ActionErrorCode, ActionResponse } from '@/lib/types/transport.types';
import { getUserId } from '@/server/api/profiles/queries';
import { getDb, schema } from '@/server/db';
import { isUniqueConstraintError } from '@/server/db/errors';

import { syncIntegrationLinkTransactions } from './sync-integration-links';

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

  updateTag({
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
    updateTag({
      tag: CACHE_TAGS.integrations,
      userId: await getUserId(),
      id: link.integrationId,
    });
  }

  return { success: true };
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
      await syncIntegrationLinkTransactions(link, tx);
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

  updateTag({ tag: CACHE_TAGS.transactions, userId });
  updateTag({ tag: CACHE_TAGS.integrations, userId });
  updateTag({ tag: CACHE_TAGS.accounts, userId });
  return response;
}
