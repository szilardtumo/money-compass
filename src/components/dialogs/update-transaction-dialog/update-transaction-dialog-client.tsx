'use client';

import { UpdateTransactionForm } from '@/components/dialogs/update-transaction-dialog/update-transaction-form';
import { useUpdateTransactionDialog } from '@/components/providers/update-transaction-dialog-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
