import { WorkflowIcon } from 'lucide-react';
import { Suspense } from 'react';

import { ComponentErrorFallback, ErrorBoundary } from '@/components/ui/error-boundary';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
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
  const [integrations] = await Promise.all([apiQueries.integrations.getIntegrations()]);

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Integrations</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <IntegrationErrorToaster />
        <ErrorBoundary FallbackComponent={ComponentErrorFallback}>
          <div>
            <Suspense fallback={<Skeleton className="w-36 h-9" />}>
              <AddIntegrationDialog />
            </Suspense>
          </div>
        </ErrorBoundary>

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
      </PageContent>
    </PageLayout>
  );
}
