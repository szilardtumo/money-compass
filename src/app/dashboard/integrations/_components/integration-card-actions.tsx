'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Integration } from '@/lib/types/integrations.types';
import { apiActions } from '@/server/api/actions';

interface IntegrationCardActionsProps {
  integration: Integration;
}

export function IntegrationCardActions({ integration }: IntegrationCardActionsProps) {
  const { execute: executeRenew, isPending: isRenewPending } = useActionWithToast(
    apiActions.integrations.startIntegrationAuth,
    {
      loadingToast: 'Connecting to the bank...',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to connect to the bank',
        description: errorMessage,
      }),
      onSuccess: ({ data }) => window.location.assign(data.url),
    },
  );
  const { execute: executeDelete } = useActionWithToast(apiActions.integrations.deleteIntegration, {
    loadingToast: 'Deleting integration...',
    successToast: 'Integration deleted!',
    errorToast: ({ errorMessage }) => ({
      title: 'Failed to delete integration',
      description: errorMessage,
    }),
  });

  return (
    <div className="w-full flex gap-4">
      {integration.status !== 'active' && (
        <Button
          isLoading={isRenewPending}
          disabled={isRenewPending}
          onClick={() =>
            executeRenew({
              institution: {
                name: integration.institutionName,
                country: integration.institutionCountry,
              },
              integrationId: integration.id,
            })
          }
        >
          Renew access
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="ml-auto">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the bank&apos;s access and stops syncing transactions. The synced
              transactions stay in your subaccounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => executeDelete(integration.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
