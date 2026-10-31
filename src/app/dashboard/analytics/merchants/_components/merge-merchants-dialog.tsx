'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Selectbox } from '@/components/ui/selectbox';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Merchant } from '@/lib/types/categories.types';
import { apiActions } from '@/server/api/actions';

interface MergeMerchantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchants: Merchant[];
  onMerged: () => void;
}

export function MergeMerchantsDialog({ open, onOpenChange, ...props }: MergeMerchantsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <MergeMerchantsForm onOpenChange={onOpenChange} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function MergeMerchantsForm({
  onOpenChange,
  merchants,
  onMerged,
}: Omit<MergeMerchantsDialogProps, 'open'>) {
  const [targetId, setTargetId] = useState<string>();
  const { execute, isExecuting } = useActionWithToast(apiActions.merchants.mergeMerchants, {
    loadingToast: 'Merging merchants...',
    successToast: 'Merchants merged!',
    errorToast: 'Failed to merge the merchants. Please try again later.',
    onSuccess: () => {
      onMerged();
      onOpenChange(false);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Merge {merchants.length} merchants</DialogTitle>
        <DialogDescription>
          Their transactions become one merchant&apos;s. It keeps its name and category, or takes
          the category of another one if it has none.
        </DialogDescription>
      </DialogHeader>
      <Selectbox
        options={merchants.map((merchant) => ({ label: merchant.name, value: merchant.id }))}
        value={targetId}
        onValueChange={setTargetId}
        placeholder="Merchant to keep"
      />
      <DialogFooter>
        <Button
          disabled={!targetId || isExecuting}
          isLoading={isExecuting}
          onClick={() =>
            targetId && execute({ merchantIds: merchants.map((merchant) => merchant.id), targetId })
          }
        >
          Merge
        </Button>
      </DialogFooter>
    </>
  );
}
