'use client';

import { EllipsisVerticalIcon, PencilIcon, StoreIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { MerchantCategoryPicker } from '@/components/categories/merchant-category-picker';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { Category, Merchant } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { apiActions } from '@/server/api/actions';

import { DrawerSheet } from './drawer-sheet';

interface MerchantDrawerClientProps {
  merchant: Merchant;
  /** For moving a name to another merchant */
  merchants: Merchant[];
  categories: Category[];
  transactions: Transaction[];
  period: string | undefined;
  total: number;
  monthlyTotals: number[];
  accounts: Account[];
  mainCurrency: string;
}

export function MerchantDrawerClient({
  merchant,
  merchants,
  categories,
  transactions,
  period,
  total,
  monthlyTotals,
  accounts,
  mainCurrency,
}: MerchantDrawerClientProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const color = merchant.category?.color ?? UNCATEGORIZED_COLOR;

  return (
    <DrawerSheet
      icon={<StoreIcon className="size-5" style={{ color }} />}
      color={color}
      title={merchant.name}
      description={<MerchantCategoryPicker merchant={merchant} categories={categories} />}
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              icon={EllipsisVerticalIcon}
              aria-label="Merchant actions"
              className="h-6 w-5 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <PencilIcon className="size-4" /> Rename
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      period={period}
      total={total}
      monthlyTotals={monthlyTotals}
      mainCurrency={mainCurrency}
    >
      <Tabs defaultValue="transactions" className="px-4 pb-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
          <TabsTrigger value="names">Names {merchant.keys.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <TransactionDayList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
          />
        </TabsContent>
        <TabsContent value="names">
          <p className="py-2 text-xs text-muted-foreground">
            The names from the bank, with all their transactions
          </p>
          <ul className="flex flex-col divide-y">
            {merchant.keys
              .toSorted((a, b) => b.transactionCount - a.transactionCount)
              .map((item) => (
                <li key={item.key} className="flex items-center gap-2 py-1 text-sm">
                  <span className="mr-auto truncate">{item.key}</span>
                  <span className="text-muted-foreground">{item.transactionCount}×</span>
                  <MoveKeyButton
                    merchantKey={item.key}
                    merchants={merchants}
                    currentMerchantId={merchant.id}
                  />
                </li>
              ))}
          </ul>
        </TabsContent>
      </Tabs>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <RenameMerchantForm merchant={merchant} onClose={() => setIsRenaming(false)} />
        </DialogContent>
      </Dialog>
    </DrawerSheet>
  );
}

function RenameMerchantForm({ merchant, onClose }: { merchant: Merchant; onClose: () => void }) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const [name, setName] = useState(merchant.name);
  const { execute, isExecuting } = useActionWithToast(apiActions.merchants.renameMerchant, {
    loadingToast: 'Renaming merchant...',
    successToast: ({ data }) =>
      data?.mergedInto ? `Merged into ${data.mergedInto.name}!` : 'Merchant renamed!',
    errorToast: 'Failed to rename the merchant. Please try again later.',
    onSuccess: ({ data }) => {
      onClose();
      if (data?.mergedInto) {
        router.push(getDrawerHref({ merchant: data.mergedInto.id }), { scroll: false });
      }
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rename {merchant.name}</DialogTitle>
        <DialogDescription>The name of another merchant merges this one into it.</DialogDescription>
      </DialogHeader>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          execute({ merchantId: merchant.id, name });
        }}
      >
        <Input aria-label="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <Button
          type="submit"
          disabled={!name.trim() || name.trim() === merchant.name || isExecuting}
          isLoading={isExecuting}
        >
          Rename
        </Button>
      </form>
    </>
  );
}

function MoveKeyButton({
  merchantKey,
  merchants,
  currentMerchantId,
}: {
  merchantKey: string;
  merchants: Merchant[];
  currentMerchantId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { execute } = useActionWithToast(apiActions.merchants.moveMerchantKey, {
    loadingToast: 'Moving...',
    successToast: 'Moved!',
    errorToast: 'Failed to move. Please try again later.',
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
