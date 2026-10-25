'use client';

import { RefreshCwIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Selectbox } from '@/components/ui/selectbox';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { apiActions } from '@/server/api/actions';

const NOT_LINKED = 'none';

interface IntegrationAccountLinkSelectProps {
  integrationAccountId: string;
  subaccountId: string | null;
  options: { label: string; value: string }[];
}

export function IntegrationAccountLinkSelect({
  integrationAccountId,
  subaccountId,
  options,
}: IntegrationAccountLinkSelectProps) {
  const { execute, isPending } = useActionWithToast(
    apiActions.integrations.setIntegrationAccountLink,
    {
      loadingToast: 'Saving link...',
      successToast: 'Link saved!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to save the link',
        description: errorMessage,
      }),
    },
  );

  return (
    <Selectbox
      aria-label="Linked subaccount"
      className="min-w-48"
      options={[{ label: 'Not linked', value: NOT_LINKED }, ...options]}
      value={subaccountId ?? NOT_LINKED}
      disabled={isPending}
      onValueChange={(value) =>
        execute({
          integrationAccountId,
          subaccountId: value === NOT_LINKED ? null : (value ?? null),
        })
      }
    />
  );
}

interface IntegrationAccountSyncButtonProps {
  integrationAccountId: string;
  disabled: boolean;
}

export function IntegrationAccountSyncButton({
  integrationAccountId,
  disabled,
}: IntegrationAccountSyncButtonProps) {
  const { execute, isPending } = useActionWithToast(
    apiActions.integrations.syncIntegrationAccount,
    {
      loadingToast: 'Syncing transactions...',
      successToast: 'Transactions synced!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to sync transactions',
        description: errorMessage,
      }),
    },
  );

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Sync transactions"
      icon={RefreshCwIcon}
      isLoading={isPending}
      disabled={disabled || isPending}
      onClick={() => execute(integrationAccountId)}
    />
  );
}
