'use client';

import { PlusIcon } from '@radix-ui/react-icons';

import { useCreateAccountDialog } from '@/components/dialogs/create-account-dialog';
import { Button } from '@/components/ui/button';

export function CreateAccountButton() {
  const { openDialog } = useCreateAccountDialog();
  return (
    <Button size="sm" onClick={() => openDialog()}>
      <PlusIcon className="mr-1 w-3 h-3" /> Add
    </Button>
  );
}
