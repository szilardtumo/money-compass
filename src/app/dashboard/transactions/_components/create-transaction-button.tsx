'use client';

import { PlusIcon } from 'lucide-react';

import { useCreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function CreateTransactionButton() {
  const { openDialog } = useCreateTransactionDialog();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" onClick={() => openDialog()}>
          <PlusIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add new transaction</TooltipContent>
    </Tooltip>
  );
}
