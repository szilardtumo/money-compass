import 'server-only';

/**
 * This file contains the queries for integrations.
 *
 * The architecture is designed to support multiple integration providers:
 *
 * 1. Each provider implements the IntegrationProvider interface
 * 2. The getIntegrations function fetches all integrations from the database
 * 3. It then groups them by provider type (currently all are assumed to be GoCardless)
 * 4. For each provider, it fetches the provider-specific data and maps the integrations
 * 5. Finally, it combines all integrations and returns them
 *
 * To add a new integration provider:
 * 1. Create a new provider implementation that follows the IntegrationProvider interface
 * 2. Add it to the integrationProviders map
 * 3. Update the database schema to include a 'type' field in the integrations table
 * 4. Update the grouping logic in getIntegrations to use the 'type' field
 */

import { InferSelectModel } from 'drizzle-orm';

import { CACHE_TAGS, cacheLife, cacheTag } from '@/lib/cache';
import { gocardlessApi } from '@/lib/gocardless';
import { GocardlessInstitution, Integration } from '@/lib/types/integrations.types';
import { createAuthenticatedApiQuery, createPublicApiQuery } from '@/server/api/create-api-query';
import { getDb } from '@/server/db';
import { accounts, subaccounts, integrations, integrationLinks } from '@/server/db/schema';

import { gocardlessProvider } from './gocardless-provider';

// Define a type for database integration model
type DbIntegration = InferSelectModel<typeof integrations> & {
  links: (InferSelectModel<typeof integrationLinks> & {
    subaccount: InferSelectModel<typeof subaccounts> & {
      account: InferSelectModel<typeof accounts>;
    };
  })[];
};

/**
 * Interface for integration providers
 */
export interface IntegrationProvider<T = unknown> {
  /**
   * Fetches data from the integration provider
   */
  fetchInitialData: () => Promise<T>;

  /**
   * Maps database integration to the Integration type
   *
   * @param integration The database integration
   * @param providerData The initial data fetched from the provider
   * @returns The mapped integration or undefined if it couldn't be mapped
   */
  mapIntegration: (integration: DbIntegration, providerData: T) => Promise<Integration | undefined>;
}

/**
 * Map of integration providers by type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const integrationProviders: Record<string, IntegrationProvider<any>> = {
  gocardless: gocardlessProvider,
};

/**
 * Returns all integrations for the user
 *
 * @returns All integrations for the user
 */
export const getIntegrations = createAuthenticatedApiQuery<void, Integration[]>(async ({ ctx }) => {
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.integrations);

  const db = await getDb(ctx.supabaseToken);

  // Fetch all integrations from the database
  const dbIntegrations = (await db.rls((tx) =>
    tx.query.integrations.findMany({
      with: { links: { with: { subaccount: { with: { account: true } } } } },
    }),
  )) satisfies DbIntegration[];

  // Group integrations by provider type
  // For now, all integrations are assumed to be GoCardless
  // In the future, we can add a 'type' field to the integrations table
  // and use it to group integrations by provider type like this:
  // const integrationsByProvider = dbIntegrations.reduce((acc, integration) => {
  //   const providerType = integration.type || 'gocardless';
  //   acc[providerType] = [...(acc[providerType] || []), integration];
  //   return acc;
  // }, {} as Record<string, DbIntegration[]>);
  const integrationsByProvider: Record<string, DbIntegration[]> = {
    gocardless: dbIntegrations,
  };

  // Process each provider's integrations
  const allIntegrationsPromises = Object.entries(integrationsByProvider).map(
    async ([providerType, integrations]) => {
      const provider = integrationProviders[providerType];

      if (!provider || integrations.length === 0) {
        // Gracefully handle missing providers
        console.warn(`No provider found for type ${providerType}`);
        return [];
      }

      // Fetch provider-specific data
      const providerData = await provider.fetchInitialData();

      // Map each integration
      const mappedIntegrationsPromises = integrations.map((integration) =>
        provider.mapIntegration(integration, providerData),
      );

      return (await Promise.all(mappedIntegrationsPromises)).filter(Boolean);
    },
  );

  // Combine all integrations
  const allIntegrations = (await Promise.all(allIntegrationsPromises)).flat();

  return allIntegrations;
});

/**
 * Returns all Gocardless institutions
 *
 * @returns All Gocardless institutions
 */
export const getGocardlessInstitutions = createPublicApiQuery<void, GocardlessInstitution[]>(
  async () => {
    'use cache';
    cacheTag.global(CACHE_TAGS.gocardlessInstitutions);
    cacheLife('weeks');

    return gocardlessApi.getInstitutions();
  },
);
