'use client';

import { RefreshCcwIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

export function SynchronizeIntegrationLinkAction({ linkId }: { linkId: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleSynchronize = useCallback(async () => {
    setIsPending(true);

    const promise = apiActions.integrationLinks.syncIntegrationLink(linkId);

    toast.promise(createToastPromise(promise), {
      loading: 'Synchronizing integration...',
      success: 'Integration synchronized!',
      error: 'Failed to synchronize integration!',
    });

    await promise;

    setIsPending(false);
  }, [linkId]);

  return (
    <Button
      icon={RefreshCcwIcon}
      size="sm"
      onClick={handleSynchronize}
      isLoading={isPending}
      disabled={isPending}
    >
      Synchronize
    </Button>
  );
}
