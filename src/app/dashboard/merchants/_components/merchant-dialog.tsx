'use client';

import { useState } from 'react';

import { MerchantCategoryPicker } from '@/components/categories/merchant-category-picker';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category, Merchant } from '@/lib/types/categories.types';
import { apiActions } from '@/server/api/actions';

interface MerchantDialogProps {
  merchant: Merchant | undefined;
  merchants: Merchant[];
  categories: Category[];
  onClose: () => void;
}

/**
 * Renames a merchant, sets its category, and moves its raw names to other merchants.
 */
export function MerchantDialog({ merchant, merchants, categories, onClose }: MerchantDialogProps) {
  return (
    <Dialog open={!!merchant} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {merchant && (
          <MerchantDialogContent
            key={merchant.id}
            merchant={merchant}
            merchants={merchants}
            categories={categories}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MerchantDialogContent({
  merchant,
  merchants,
  categories,
  onClose,
}: Omit<MerchantDialogProps, 'merchant'> & { merchant: Merchant }) {
  const [name, setName] = useState(merchant.name);

  const { execute: renameMerchant, isExecuting: isRenaming } = useActionWithToast(
    apiActions.merchants.renameMerchant,
    {
      loadingToast: 'Renaming merchant...',
      successToast: ({ data }) =>
        data?.mergedInto ? `Merged into ${data.mergedInto}!` : 'Merchant renamed!',
      errorToast: 'Failed to rename the merchant. Please try again later.',
      onSuccess: ({ data }) => data?.mergedInto && onClose(),
    },
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{merchant.name}</DialogTitle>
        <DialogDescription>
          {merchant.transactionCount} transaction{merchant.transactionCount === 1 ? '' : 's'}
        </DialogDescription>
      </DialogHeader>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          renameMerchant({ merchantId: merchant.id, name });
        }}
      >
        <Label htmlFor="merchant-name">Name</Label>
        <div className="flex gap-2">
          <Input
            id="merchant-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            type="submit"
            disabled={!name.trim() || name.trim() === merchant.name || isRenaming}
            isLoading={isRenaming}
          >
            Rename
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The name of another merchant merges this one into it.
        </p>
      </form>

      <div className="flex items-center gap-2">
        <Label>Category</Label>
        <MerchantCategoryPicker merchant={merchant} categories={categories} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Names from the bank</Label>
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {merchant.keys
            .toSorted((a, b) => b.transactionCount - a.transactionCount)
            .map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                <span className="mr-auto">{item.key}</span>
                <span className="text-muted-foreground">{item.transactionCount}</span>
                <MoveKeyButton
                  merchantKey={item.key}
                  merchants={merchants}
                  currentMerchantId={merchant.id}
                  onMoved={() => merchant.keys.length === 1 && onClose()}
                />
              </li>
            ))}
        </ul>
      </div>
    </>
  );
}

function MoveKeyButton({
  merchantKey,
  merchants,
  currentMerchantId,
  onMoved,
}: {
  merchantKey: string;
  merchants: Merchant[];
  currentMerchantId: string;
  onMoved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { execute } = useActionWithToast(apiActions.merchants.moveMerchantKey, {
    loadingToast: 'Moving...',
    successToast: 'Moved!',
    errorToast: 'Failed to move. Please try again later.',
    onSuccess: onMoved,
  });

  const move = (target: { merchantId: string } | { name: string }) => {
    execute({ key: merchantKey, target });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          Move to...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        {/* Filtered here, because cmdk is slow with all merchants */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Merchant or new name..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No merchant found.</CommandEmpty>
            {!!search.trim() && (
              <CommandGroup>
                <CommandItem value={`new:${search}`} onSelect={() => move({ name: search.trim() })}>
                  New merchant &quot;{search.trim()}&quot;
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Merchants">
              {merchants
                .filter(
                  (merchant) =>
                    merchant.id !== currentMerchantId &&
                    merchant.name.toLowerCase().includes(search.trim().toLowerCase()),
                )
                .slice(0, 50)
                .map((merchant) => (
                  <CommandItem
                    key={merchant.id}
                    value={merchant.name}
                    onSelect={() => move({ merchantId: merchant.id })}
                  >
                    {merchant.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
