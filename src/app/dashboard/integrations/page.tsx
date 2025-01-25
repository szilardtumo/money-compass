import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { apiQueries } from '@/server/api/queries';

import { AddIntegrationDialog } from './_components/AddIntegrationDialog';
import { IntegrationCard } from './_components/IntegrationCard';

export default async function StatisticsPage() {
  const [integrations] = await Promise.all([apiQueries.integrations.getIntegrations()]);

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Integrations</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <div>
          <AddIntegrationDialog />
        </div>

        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </PageContent>
    </PageLayout>
  );
}
