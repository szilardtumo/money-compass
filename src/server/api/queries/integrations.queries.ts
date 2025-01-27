import 'server-only';

import { addDays } from 'date-fns';

import { CACHE_TAGS, cacheLife, cacheTag } from '@/lib/cache';
import { gocardlessApi, GocardlessRequisition } from '@/lib/gocardless';
import { GocardlessInstitution, Integration } from '@/lib/types/integrations.types';
import { createAuthenticatedApiQuery, createPublicApiQuery } from '@/server/api/create-api-query';
import { getDb } from '@/server/db';

const parseGocardlessStatus = (status: GocardlessRequisition['status']): Integration['status'] => {
  // Status codes: https://developer.gocardless.com/bank-account-data/statuses#statuses
  switch (status) {
    case 'CR':
    case 'GC':
    case 'UA':
    case 'SA':
    case 'GA':
    case 'RJ':
      return 'unconfirmed';
    case 'LN':
      return 'active';
    case 'EX':
      return 'expired';
    default:
      return 'unknown';
  }
};

const getGocardlessAccountDetails = async (
  id: string,
): Promise<Integration['accounts'][number] | undefined> => {
  'use cache';
  cacheLife('days');

  const account = await gocardlessApi.getAccountDetails(id);

  if (!account) {
    return undefined;
  }

  return {
    id: account.resourceId,
    name: account.displayName || account.name,
    ownerName: account.ownerName,
    iban: account.iban,
    currency: account.currency,
  };
};

export const getIntegrations = createAuthenticatedApiQuery<void, Integration[]>(async ({ ctx }) => {
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.integrations);

  const db = await getDb(ctx.supabaseToken);

  const [integrations, requisitions, institutions] = await Promise.all([
    db.rls((tx) => tx.query.integrations.findMany()),
    gocardlessApi.getRequisitions(),
    gocardlessApi.getInstitutions(),
  ]);

  const mergedDataPromises = integrations.map(async (integration) => {
    const requisition = requisitions.find(
      (requisition) => requisition.id === integration.externalId,
    );

    if (!requisition) {
      return undefined;
    }

    const institution = institutions.find(
      (institution) => institution.id === requisition.institution_id,
    );

    const status = parseGocardlessStatus(requisition.status);

    const accounts = (
      await Promise.all(requisition.accounts.map(getGocardlessAccountDetails))
    ).filter(Boolean);

    return {
      ...integration,
      status,
      expiresAt:
        requisition.created &&
        ['active', 'expired'].includes(status) &&
        institution?.max_access_valid_for_days
          ? addDays(new Date(requisition.created), Number(institution.max_access_valid_for_days))
          : undefined,
      confirmationUrl: requisition.link,
      institution: {
        id: requisition.institution_id,
        name: institution?.name ?? requisition.institution_id,
        bic: institution?.bic,
        logoUrl: institution?.logo,
      },
      accounts,
    } satisfies Integration;
  });

  const mergedData = (await Promise.all(mergedDataPromises)).filter(Boolean);
  return mergedData;
});

export const getGocardlessInstitutions = createPublicApiQuery<void, GocardlessInstitution[]>(
  async () => {
    'use cache';
    cacheTag.global(CACHE_TAGS.gocardlessInstitutions);
    cacheLife('weeks');

    return gocardlessApi.getInstitutions();
  },
);
