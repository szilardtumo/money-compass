'use client';

import { TrashIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import { DropdownMenuItem, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';
import { deleteAccount } from '@/lib/db/accounts.actions';
import { createToastPromise } from '@/lib/utils/toasts';

interface DeleteAccountMenuItemProps {
  accountId: string;
}

export function DeleteAccountMenuItem({ accountId }: DeleteAccountMenuItemProps) {
  const onDeleteAccount = async () => {
    const promise = deleteAccount(accountId);

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
