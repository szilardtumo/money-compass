import { Integration } from '@/lib/types/integrations.types';
import { apiQueries } from '@/server/api/queries';

import { LinkIntegrationDialogClient } from './LinkIntegrationDialogClient';

interface LinkIntegrationDialogProps {
  integration: Integration;
  integrationAccountId: string;
}

export async function LinkIntegrationDialog({
  integration,
  integrationAccountId,
}: LinkIntegrationDialogProps) {
  const accounts = await apiQueries.accounts.getAccounts();

  return (
    <LinkIntegrationDialogClient
      accounts={accounts}
      integration={integration}
      integrationAccountId={integrationAccountId}
    />
  );
}
