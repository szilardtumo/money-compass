'use client';

import { useCreateTransactionDialog } from '@/components/providers/create-transaction-dialog-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimpleAccount } from '@/lib/types/accounts.types';

import { CreateTransactionForm } from './create-transaction-form';

interface CreateTransactionDialogClientProps {
  accounts: SimpleAccount[];
}

export async function CreateTransactionDialogClient({
  accounts,
}: CreateTransactionDialogClientProps) {
  const { isOpen, internal } = useCreateTransactionDialog();

  return (
    <Dialog open={isOpen} onOpenChange={internal.setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new transaction</DialogTitle>
        </DialogHeader>
        <CreateTransactionForm
          accounts={accounts}
          defaultValues={internal.defaultValues}
          onSuccess={() => internal.setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
