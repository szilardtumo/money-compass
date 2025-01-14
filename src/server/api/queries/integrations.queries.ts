import 'server-only';

import { addDays } from 'date-fns';

import { CACHE_TAGS, cacheLife, cacheTag } from '@/lib/cache';
import {
  GetInstitutionsResponse,
  GetRequisitionsResponse,
  RequisitionResponse,
} from '@/lib/gocardless/response.types';
import { getGocardlessClient } from '@/lib/gocardless/server';
import { Integration } from '@/lib/types/integrations.types';
import { uniqueBy } from '@/lib/utils/unique-by';
import { createAuthenticatedApiQuery, createPublicApiQuery } from '@/server/api/create-api-query';
import { getDb } from '@/server/db';

const gocardlessCountries = ['HU', 'RO'];

export const getGocardlessInstitutions = createPublicApiQuery<void, GetInstitutionsResponse>(
  async () => {
    'use cache';
    cacheTag.global(CACHE_TAGS.gocardlessInstitutions);
    cacheLife('weeks');

    const gocardless = await getGocardlessClient();
    const responses = await Promise.all(
      gocardlessCountries.map(
        (country) =>
          gocardless.institution.getInstitutions({ country }) as Promise<GetInstitutionsResponse>,
      ),
    );

    return uniqueBy(responses.flat(), (institution) => institution.id);
  },
);

const getGocardlessRequisitions = createPublicApiQuery<void, GetRequisitionsResponse>(async () => {
  'use cache';
  cacheTag.global(CACHE_TAGS.integrations);

  const gocardless = await getGocardlessClient();
  return gocardless.requisition.getRequisitions() as Promise<GetRequisitionsResponse>;
});

const parseGocardlessStatus = (status: RequisitionResponse['status']): Integration['status'] => {
  switch (status) {
    case 'LN':
      return 'active';
    case 'CR':
      return 'pending';
    case 'EX':
      return 'expired';
    default:
      return 'unknown';
  }
};

export const getIntegrations = createAuthenticatedApiQuery<void, Integration[]>(async ({ ctx }) => {
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.integrations);

  const db = await getDb(ctx.supabaseToken);

  const [integrations, requisitions, institutions] = await Promise.all([
    db.rls((tx) => tx.query.integrations.findMany()),
    getGocardlessRequisitions(),
    getGocardlessInstitutions(),
  ]);

  const mergedData = integrations
    .map((integration) => {
      const requisition = requisitions.results.find(
        (requisition) => requisition.id === integration.externalId,
      );

      if (!requisition) {
        return undefined;
      }

      const institution = institutions.find(
        (institution) => institution.id === requisition.institution_id,
      );

      const status = parseGocardlessStatus(requisition.status);

      return {
        ...integration,
        status,
        expiresAt:
          requisition.created && status === 'active' && institution?.max_access_valid_for_days
            ? addDays(new Date(requisition.created), Number(institution.max_access_valid_for_days))
            : undefined,
        institution: {
          id: requisition.institution_id,
          name: institution?.name ?? requisition.institution_id,
          bic: institution?.bic,
          logoUrl: institution?.logo,
        },
      } satisfies Integration;
    })
    .filter(Boolean);

  return mergedData;
});
