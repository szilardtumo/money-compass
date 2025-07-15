'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Currency } from '@/lib/types/currencies.types';

import { useCreateAccountDialog } from './create-account-dialog-context';
import { CreateAccountForm } from './create-account-form';

interface CreateAccountDialogClientProps {
  currencies: Currency[];
}

export function CreateAccountDialogClient({ currencies }: CreateAccountDialogClientProps) {
  const { isOpen, internal } = useCreateAccountDialog();

  return (
    <Dialog open={isOpen} onOpenChange={internal.setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>Add a new account to keep track of your finances.</DialogDescription>
        </DialogHeader>
        <CreateAccountForm
          currencies={currencies}
          defaultValues={internal.defaultValues}
          onSuccess={() => internal.setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
