'use client';

import { useCreateTransactionDialog } from '@/components/providers/create-transaction-dialog-provider';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface AddTransactionMenuItemProps {
  accountId: string;
}

export function AddTransactionMenuItem({ accountId }: AddTransactionMenuItemProps) {
  const { openDialog } = useCreateTransactionDialog();

  return (
    <DropdownMenuItem onSelect={() => openDialog({ account: accountId })}>
      Add Transaction
    </DropdownMenuItem>
  );
}
