'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Currency } from '@/lib/types/currencies.types';

import { useUpdateAccountDialog } from './update-account-dialog-context';
import { UpdateAccountForm } from './update-account-form';

interface UpdateAccountDialogClientProps {
  currencies: Currency[];
}

export function UpdateAccountDialogClient({ currencies }: UpdateAccountDialogClientProps) {
  const { isOpen, internal } = useUpdateAccountDialog();

  return (
    <Dialog open={isOpen} onOpenChange={internal.setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Update account</DialogTitle>
          <DialogDescription>Update an existing account.</DialogDescription>
        </DialogHeader>
        <UpdateAccountForm
          currencies={currencies}
          defaultValues={internal.defaultValues}
          onSuccess={() => internal.setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
