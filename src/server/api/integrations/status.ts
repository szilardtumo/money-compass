import { differenceInDays, isBefore } from 'date-fns';

import { Integration } from '@/lib/types/integrations.types';

export function getIntegrationStatus(
  integration: Pick<Integration, 'revokedAt' | 'expiresAt'>,
  now: Date,
): Integration['status'] {
  return integration.revokedAt
    ? 'revoked'
    : isBefore(integration.expiresAt, now)
      ? 'expired'
      : differenceInDays(integration.expiresAt, now) < 7
        ? 'expiring'
        : 'active';
}
