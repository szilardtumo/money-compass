'use client';

import { UpdateIcon } from '@radix-ui/react-icons';
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
import { SimpleAccount } from '@/lib/types/accounts.types';

import { UpdateBalancesForm } from './update-balances-form';

interface UpdateBalancesDialogProps {
  accounts: SimpleAccount[];
}

export function UpdateBalancesDialog({ accounts }: UpdateBalancesDialogProps) {
  const [open, setIsOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="card" disabled={!accounts.length}>
          <UpdateIcon className="w-6 h-6" />
          Update balances
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] justify-center">
        <DialogHeader>
          <DialogTitle>Update balances</DialogTitle>
          <DialogDescription>Update the balance of all your accounts at once.</DialogDescription>
        </DialogHeader>
        <UpdateBalancesForm accounts={accounts} onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
