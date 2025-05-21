'use client';

import { TrashIcon } from '@radix-ui/react-icons';

import { DropdownMenuItem, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { apiActions } from '@/server/api/actions';

interface DeleteAccountMenuItemProps {
  accountId: string;
}

export function DeleteAccountMenuItem({ accountId }: DeleteAccountMenuItemProps) {
  const { execute: executeDeleteAccount } = useActionWithToast(apiActions.accounts.deleteAccount, {
    loadingToast: 'Deleting account...',
    successToast: 'Account deleted!',
    errorToast: ({ errorMessage }) => ({
      title: 'Failed to delete account',
      description: errorMessage,
    }),
  });

  return (
    <DropdownMenuItem onSelect={() => executeDeleteAccount({ accountId })}>
      Delete
      <DropdownMenuShortcut>
        <TrashIcon />
      </DropdownMenuShortcut>
    </DropdownMenuItem>
  );
}
