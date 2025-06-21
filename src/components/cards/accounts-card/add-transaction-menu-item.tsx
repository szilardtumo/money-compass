'use client';

import { useCreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface AddTransactionMenuItemProps {
  accountId: string;
}

export function AddTransactionMenuItem({ accountId }: AddTransactionMenuItemProps) {
  const { openDialog } = useCreateTransactionDialog();

  return (
    <DropdownMenuItem onSelect={() => openDialog({ accountId })}>Add Transaction</DropdownMenuItem>
  );
}
