import { LandmarkIcon, PlusIcon } from 'lucide-react';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
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
import { ConnectIbkrDialog } from './_components/connect-ibkr-dialog';
import { IntegrationCard } from './_components/integration-card';
import { IntegrationErrorToaster } from './_components/integration-error-toaster';

// For the server actions on the page: an IBKR sync downloads up to 4 statements
export const maxDuration = 300;

export default async function IntegrationsPage() {
  const [integrations, accounts, correctionCounts] = await Promise.all([
    apiQueries.integrations.getIntegrations(),
    apiQueries.accounts.getAccounts(),
    apiQueries.integrations.getCorrectionCounts(),
  ]);

  const linkedSubaccountIds = new Set(
    integrations.flatMap((integration) =>
      integration.accounts.flatMap((account) => account.subaccountId ?? []),
    ),
  );

  return (
    <>
      <PageHeaderSlotContent>
        <PageHeaderTitle>Integrations</PageHeaderTitle>
        <ConnectIbkrDialog>
          <Button variant="outline" icon={PlusIcon}>
            Connect IBKR
          </Button>
        </ConnectIbkrDialog>
        <Suspense fallback={<Skeleton className="w-36 h-9" />}>
          <AddIntegrationDialog />
        </Suspense>
      </PageHeaderSlotContent>

      <Suspense>
        <IntegrationErrorToaster />
      </Suspense>

      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          accounts={accounts}
          linkedSubaccountIds={linkedSubaccountIds}
          correctionCounts={correctionCounts}
        />
      ))}

      {!integrations.length && (
        <PlaceholderArea className="h-72">
          <LandmarkIcon className="size-10 text-muted-foreground" />
          <PlaceholderAreaTitle>No integrations.</PlaceholderAreaTitle>
          <PlaceholderAreaDescription>
            Connect a bank or IBKR to sync the transactions of your accounts.
          </PlaceholderAreaDescription>
        </PlaceholderArea>
      )}
    </>
  );
}
