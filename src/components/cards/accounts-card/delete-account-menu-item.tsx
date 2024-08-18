'use client';

import { TrashIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import { DropdownMenuItem, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

interface DeleteAccountMenuItemProps {
  accountId: string;
}

export function DeleteAccountMenuItem({ accountId }: DeleteAccountMenuItemProps) {
  const onDeleteAccount = async () => {
    const promise = apiActions.accounts.deleteAccount(accountId);

    toast.promise(createToastPromise(promise), {
      loading: 'Deleting account...',
      success: 'Account deleted!',
      error: () => 'Failed to delete account.',
    });

    await promise;
  };

  return (
    <DropdownMenuItem onSelect={onDeleteAccount}>
      Delete
      <DropdownMenuShortcut>
        <TrashIcon />
      </DropdownMenuShortcut>
    </DropdownMenuItem>
  );
}
