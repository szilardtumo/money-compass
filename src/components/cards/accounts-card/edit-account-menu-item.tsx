'use client';

import { useUpsertAccountDialog } from '@/components/providers/upsert-account-dialog-provider';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Account } from '@/lib/types/accounts.types';

interface EditAccountMenuItemProps {
  account: Account;
}

export function EditAccountMenuItem({ account }: EditAccountMenuItemProps) {
  const { openDialog } = useUpsertAccountDialog();

  return <DropdownMenuItem onSelect={() => openDialog(account)}>Edit</DropdownMenuItem>;
}
