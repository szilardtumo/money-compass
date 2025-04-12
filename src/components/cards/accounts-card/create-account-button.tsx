'use client';

import { PlusIcon } from '@radix-ui/react-icons';

import { useUpsertAccountDialog } from '@/components/dialogs/upsert-account-dialog';
import { Button } from '@/components/ui/button';

export function CreateAccountButton() {
  const { openDialog } = useUpsertAccountDialog();
  return (
    <Button size="sm" onClick={() => openDialog()}>
      <PlusIcon className="mr-1 w-3 h-3" /> Add
    </Button>
  );
}
