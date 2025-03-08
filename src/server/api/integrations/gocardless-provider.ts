import { addDays } from 'date-fns';

import { gocardlessApi, GocardlessRequisition } from '@/lib/gocardless';
import { GocardlessInstitution, Integration } from '@/lib/types/integrations.types';

import type { IntegrationProvider } from './queries';

/**
 * Parses the Gocardless requisition status to our internal integration status format
 *
 * @param status The Gocardless requisition status
 * @returns The mapped internal integration status
 */
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

/**
 * Returns the Gocardless account details for the given account ID
 *
 * @param id The Gocardless account ID
 * @returns The Gocardless account details
 */
const getGocardlessAccountDetails = async (
  id: string,
): Promise<Integration['accounts'][number] | undefined> => {
  const account = await gocardlessApi.getAccountDetails(id);

  if (!account) {
    return undefined;
  }

  return {
    id,
    name: account.displayName || account.name,
    ownerName: account.ownerName,
    iban: account.iban,
    currency: account.currency.toLowerCase(),
  };
};

/**
 * GoCardless integration provider
 */
export const gocardlessProvider: IntegrationProvider<{
  requisitions: GocardlessRequisition[];
  institutions: GocardlessInstitution[];
}> = {
  fetchInitialData: async () => {
    const [requisitions, institutions] = await Promise.all([
      gocardlessApi.getRequisitions(),
      gocardlessApi.getInstitutions(),
    ]);

    return { requisitions, institutions };
  },

  mapIntegration: async (integration, providerData) => {
    const { requisitions, institutions } = providerData;

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
      id: integration.id,
      name: integration.name,
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
      links: integration.links.map((link) => ({
        id: link.id,
        integrationAccountId: link.integrationAccountId,
        lastSyncedAt: link.lastSyncedAt ?? undefined,
        syncCount: link.syncCount,
        subaccount: {
          id: link.subaccountId,
          name: `${link.subaccount.name} (${link.subaccount.account.name})`,
          accountId: link.subaccount.accountId,
          originalCurrency: link.subaccount.currency,
        },
      })),
    } satisfies Integration;
  },
};
