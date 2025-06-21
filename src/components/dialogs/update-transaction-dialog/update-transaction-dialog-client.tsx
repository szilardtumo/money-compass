'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useUpdateTransactionDialog } from './update-transaction-dialog-context';
import { UpdateTransactionForm } from './update-transaction-form';

export function UpdateTransactionDialogClient() {
  const { isOpen, internal } = useUpdateTransactionDialog();

  if (!internal.defaultValues) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={internal.setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update transaction</DialogTitle>
        </DialogHeader>

        <UpdateTransactionForm
          currency={internal.defaultValues?.currency}
          defaultValues={internal.defaultValues}
          onSuccess={() => internal.setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
