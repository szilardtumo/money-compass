'use client';

import { ExternalLink } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

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
import { Integration } from '@/lib/types/integrations.types';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

interface IntegrationCardActionsProps {
  integration: Integration;
}
export function IntegrationCardActions({ integration }: IntegrationCardActionsProps) {
  const [isRenewPending, setRenewPending] = useState(false);

  const onRenew = useCallback(async () => {
    setRenewPending(true);
    const promise = apiActions.integrations.renewGocardlessIntegration(integration.id);

    toast.promise(createToastPromise(promise), {
      loading: 'Renewing integration...',
      success:
        "Integration renewed! You will be redirected to the institution's website to confirm the integration.",
      error: 'Failed to renew integration.',
    });

    const response = await promise;

    if (response.success) {
      window.location.assign(response.data.confirmationUrl);
    }

    setRenewPending(false);
  }, [integration.id]);

  const onDelete = useCallback(async () => {
    const promise = apiActions.integrations.deleteIntegration(integration.id);

    toast.promise(createToastPromise(promise), {
      loading: 'Deleting integration...',
      success: 'Integration deleted!',
      error: 'Failed to delete integration.',
    });

    await promise;
  }, [integration.id]);

  return (
    <div className="w-full flex gap-2 justify-between">
      {integration.status === 'unconfirmed' && (
        <Button asChild icon={ExternalLink} iconPlacement="right">
          <a href={integration.confirmationUrl}>Confirm</a>
        </Button>
      )}
      {['expired', 'active'].includes(integration.status) && (
        <Button onClick={onRenew} isLoading={isRenewPending} disabled={isRenewPending}>
          Renew
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This unlinks it from the account and stops synchronizing transactions. The already
              synchronized transactions will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
