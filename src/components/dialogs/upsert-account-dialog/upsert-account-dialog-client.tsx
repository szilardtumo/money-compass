'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Currency } from '@/lib/types/currencies.types';

import { useUpsertAccountDialog } from './upsert-account-dialog-context';
import { UpsertAccountForm } from './upsert-account-form';

interface UpsertAccountDialogClientProps {
  currencies: Currency[];
}

export function UpsertAccountDialogClient({ currencies }: UpsertAccountDialogClientProps) {
  const { isOpen, internal } = useUpsertAccountDialog();
  const isUpdate = !!internal.defaultValues && 'id' in internal.defaultValues;

  return (
    <Dialog open={isOpen} onOpenChange={internal.setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Update account' : 'Add account'}</DialogTitle>
          {!isUpdate && (
            <DialogDescription>Add a new account to keep track of your finances.</DialogDescription>
          )}
        </DialogHeader>
        <UpsertAccountForm
          currencies={currencies}
          defaultValues={internal.defaultValues}
          onSuccess={() => internal.setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
