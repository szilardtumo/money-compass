import 'server-only';

import { count, eq } from 'drizzle-orm';
import { cacheLife } from 'next/cache';

import { createApiContext, createApiQuery } from '@/lib/api';
import * as enableBanking from '@/lib/enable-banking';
import { Institution, Integration } from '@/lib/types/integrations.types';
import { schema } from '@/server/db';

import { integrationProviders } from './providers';
import { getIntegrationStatus } from './status';
import { getTodaySyncCount } from './sync';

export const getIntegrations = createApiQuery<void, Integration[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  const integrations = await db.rls((tx) =>
    tx.query.integrations.findMany({
      columns: { credentials: false },
      with: {
        accounts: {
          orderBy: (accounts, { asc }) => [
            asc(accounts.createdAt),
            asc(accounts.identificationHash),
          ],
          with: {
            syncLogs: { orderBy: (logs, { desc }) => desc(logs.createdAt), limit: 10 },
          },
        },
      },
      orderBy: (integrations, { asc }) => asc(integrations.createdAt),
    }),
  );

  // Pages can't read the current time while they are prerendered, so the query computes these
  return integrations.map(({ accounts, ...integration }) => ({
    ...integration,
    status: getIntegrationStatus(
      integration,
      new Date(),
      integrationProviders[integration.provider].expiryWarningDays,
    ),
    accounts: accounts.map((account) => ({ ...account, syncsToday: getTodaySyncCount(account) })),
  }));
});

export const getInstitutions = createApiQuery<void, Institution[]>(async () => {
  // In-memory caches don't survive between serverless requests, and the list is large
  'use cache: remote';
  cacheLife('weeks');

  return enableBanking.getInstitutions();
});

/** The number of correction transactions by subaccount, which linking an IBKR account deletes */
export const getCorrectionCounts = createApiQuery<void, Record<string, number>>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  const rows = await db.rls((tx) =>
    tx
      .select({ subaccountId: schema.transactions.subaccountId, count: count() })
      .from(schema.transactions)
      .where(eq(schema.transactions.type, 'correction'))
      .groupBy(schema.transactions.subaccountId),
  );

  return Object.fromEntries(rows.map((row) => [row.subaccountId, row.count]));
});
