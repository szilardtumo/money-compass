import { LandmarkIcon } from 'lucide-react';
import { Suspense } from 'react';

import { PageHeaderSlotContent } from '@/components/ui/page-header-slot';
import { PageHeaderTitle } from '@/components/ui/page-layout';
import {
  PlaceholderArea,
  PlaceholderAreaDescription,
  PlaceholderAreaTitle,
} from '@/components/ui/placeholder-area';
import { Skeleton } from '@/components/ui/skeleton';
import { apiQueries } from '@/server/api/queries';

import { AddIntegrationDialog } from './_components/add-integration-dialog';
import { IntegrationCard } from './_components/integration-card';
import { IntegrationErrorToaster } from './_components/integration-error-toaster';

export default async function IntegrationsPage() {
  const [integrations, accounts] = await Promise.all([
    apiQueries.integrations.getIntegrations(),
    apiQueries.accounts.getAccounts(),
  ]);

  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Integrations</PageHeaderTitle>
        <Suspense fallback={<Skeleton className="w-36 h-9" />}>
          <AddIntegrationDialog />
        </Suspense>
      </PageHeaderSlotContent>

      <Suspense>
        <IntegrationErrorToaster />
      </Suspense>

      {integrations.map((integration) => (
        <IntegrationCard key={integration.id} integration={integration} accounts={accounts} />
      ))}

      {!integrations.length && (
        <PlaceholderArea className="h-72">
          <LandmarkIcon className="size-10 text-muted-foreground" />
          <PlaceholderAreaTitle>No integrations.</PlaceholderAreaTitle>
          <PlaceholderAreaDescription>
            Connect a bank to sync the transactions of your accounts.
          </PlaceholderAreaDescription>
        </PlaceholderArea>
      )}
    </>
  );
}
