'use client';

import { PlusIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Currency } from '@/lib/types/currencies.types';

import { CreateAccountForm } from './create-account-form';

interface CreateAccountDialogProps {
  currencies: Currency[];
}

export function CreateAccountDialog({ currencies }: CreateAccountDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-1 w-3 h-3" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] justify-center">
        <DialogHeader>
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>Add a new account to keep track of your finances.</DialogDescription>
        </DialogHeader>
        <CreateAccountForm currencies={currencies} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
