'use client';

import { useUpsertAccountDialog } from '@/components/providers/upsert-account-dialog-provider';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { SimpleAccount } from '@/lib/types/accounts.types';

interface EditAccountMenuItemProps {
  account: SimpleAccount;
}

export function EditAccountMenuItem({ account }: EditAccountMenuItemProps) {
  const { openDialog } = useUpsertAccountDialog();

  return <DropdownMenuItem onSelect={() => openDialog(account)}>Edit</DropdownMenuItem>;
}
