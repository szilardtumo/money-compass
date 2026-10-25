import 'server-only';

import { differenceInDays, isPast } from 'date-fns';
import { cacheLife } from 'next/cache';

import { createApiContext, createApiQuery } from '@/lib/api';
import * as enableBanking from '@/lib/enable-banking';
import { Institution, Integration } from '@/lib/types/integrations.types';

import { getTodaySyncCount } from './sync';

export const getIntegrations = createApiQuery<void, Integration[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  const integrations = await db.rls((tx) =>
    tx.query.integrations.findMany({
      with: {
        accounts: {
          orderBy: (accounts, { asc }) => [
            asc(accounts.createdAt),
            asc(accounts.identificationHash),
          ],
        },
      },
      orderBy: (integrations, { asc }) => asc(integrations.createdAt),
    }),
  );

  // Pages can't read the current time while they are prerendered, so the query computes these
  return integrations.map(({ accounts, ...integration }) => ({
    ...integration,
    status: integration.revokedAt
      ? 'revoked'
      : isPast(integration.expiresAt)
        ? 'expired'
        : differenceInDays(integration.expiresAt, new Date()) < 7
          ? 'expiring'
          : 'active',
    accounts: accounts.map((account) => ({ ...account, syncsToday: getTodaySyncCount(account) })),
  }));
});

export const getInstitutions = createApiQuery<void, Institution[]>(async () => {
  // In-memory caches don't survive between serverless requests, and the list is large
  'use cache: remote';
  cacheLife('weeks');

  return enableBanking.getInstitutions();
});
