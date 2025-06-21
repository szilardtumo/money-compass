import { WorkflowIcon } from 'lucide-react';
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

import { AddIntegrationDialog } from './_components/AddIntegrationDialog';
import { IntegrationCard } from './_components/IntegrationCard';
import { IntegrationErrorToaster } from './_components/IntegrationErrorToaster';

export default async function IntegrationsPage() {
  const integrations = await apiQueries.integrations.getIntegrations();

  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Integrations</PageHeaderTitle>
      </PageHeaderSlotContent>

      <IntegrationErrorToaster />

      <Suspense fallback={<Skeleton className="w-36 h-9" />}>
        <AddIntegrationDialog />
      </Suspense>

      {integrations.map((integration) => (
        <IntegrationCard key={integration.id} integration={integration} />
      ))}

      {!integrations.length && (
        <PlaceholderArea className="h-72">
          <WorkflowIcon className="w-10 h-10 text-muted-foreground" />
          <PlaceholderAreaTitle>No integrations.</PlaceholderAreaTitle>
          <PlaceholderAreaDescription>
            Add a new integration to start syncing transactions.
          </PlaceholderAreaDescription>
        </PlaceholderArea>
      )}
    </>
  );
}
