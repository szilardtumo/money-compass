'use client';

import { useCreateTransactionDialog } from '@/app/_components/create-transaction-dialog-provider';
import { CreateTransactionForm } from '@/app/_components/create-transaction-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimpleAccount } from '@/lib/types/accounts.types';

interface CreateTransactionDialogProps {
  accounts: SimpleAccount[];
}

export async function CreateTransactionDialog({ accounts }: CreateTransactionDialogProps) {
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
