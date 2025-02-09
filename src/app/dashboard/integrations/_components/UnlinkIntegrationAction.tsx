'use client';

import { UnlinkIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

interface UnlinkIntegrationActionProps {
  linkId: string;
}

export function UnlinkIntegrationAction({ linkId }: UnlinkIntegrationActionProps) {
  const [isPending, setIsPending] = useState(false);

  const handleUnlink = useCallback(async () => {
    setIsPending(true);

    const promise = apiActions.integrationLinks.unlinkIntegration(linkId);

    toast.promise(createToastPromise(promise), {
      loading: 'Unlinking integration...',
      success: 'Integration unlinked!',
      error: 'Failed to unlink integration!',
    });

    await promise;

    setIsPending(false);
  }, [linkId]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          icon={UnlinkIcon}
          isLoading={isPending}
          disabled={isPending}
        >
          Unlink
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to unlink this integration?</AlertDialogTitle>
          <AlertDialogDescription>
            Transactions will no longer be synchronize d with this integration. You can link it
            again later any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleUnlink}>Confirm</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
