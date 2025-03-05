'use client';

import { PlusIcon } from 'lucide-react';
import { Suspense, useState } from 'react';

import { AddIntegrationForm } from '@/app/dashboard/integrations/_components/AddIntegrationForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader } from '@/components/ui/loader';
import { GocardlessInstitution } from '@/lib/types/integrations.types';

interface AddIntegrationDialogClientProps {
  gocardlessInstitutions: GocardlessInstitution[];
}

export function AddIntegrationDialogClient({
  gocardlessInstitutions,
}: AddIntegrationDialogClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={PlusIcon}>Add integration</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new integration</DialogTitle>
          <DialogDescription>
            Add a new integration to automatically synchronize your transactions with your bank
            account.
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={<Loader />}>
          <AddIntegrationForm
            gocardlessInstitutions={gocardlessInstitutions}
            onSuccess={() => setIsOpen(false)}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
