'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Account } from '@/lib/types/accounts.types';

import { useCreateTransactionDialog } from './create-transaction-dialog-context';
import { CreateTransactionForm } from './create-transaction-form';

interface CreateTransactionDialogClientProps {
  accounts: Account[];
}

export function CreateTransactionDialogClient({ accounts }: CreateTransactionDialogClientProps) {
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
