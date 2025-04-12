'use client';

import { PlusIcon } from '@radix-ui/react-icons';

import { useCreateTransactionDialog } from '@/components/dialogs/create-transaction-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function CreateTransactionButton() {
  const { openDialog } = useCreateTransactionDialog();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" onClick={() => openDialog()}>
          <PlusIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add new transaction</TooltipContent>
    </Tooltip>
  );
}
