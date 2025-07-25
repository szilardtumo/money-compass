'use client';

import { useUpdateAccountDialog } from '@/components/dialogs/update-account-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Account } from '@/lib/types/accounts.types';

interface EditAccountMenuItemProps {
  account: Account;
}

export function EditAccountMenuItem({ account }: EditAccountMenuItemProps) {
  const { openDialog } = useUpdateAccountDialog();

  return <DropdownMenuItem onSelect={() => openDialog(account)}>Edit</DropdownMenuItem>;
}
