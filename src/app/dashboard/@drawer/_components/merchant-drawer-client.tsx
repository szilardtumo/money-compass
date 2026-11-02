'use client';

import { cn } from 'cn';
import { EllipsisVerticalIcon, PencilIcon, StoreIcon } from 'lucide-react';
import { useState } from 'react';

import { CategoryBadge, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { MerchantCategoryPicker } from '@/components/categories/merchant-category-picker';
import { DrawerLink, useDrawerHref } from '@/components/drawers/drawer-link';
import { useNavigate } from '@/components/navigation-progress';
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
import { groupBy } from '@/lib/utils/group-by';
import { formatPeriodLabel, parsePeriod } from '@/lib/utils/periods';
import { apiActions } from '@/server/api/actions';

import { DrawerSheet, TAB_CONTENT } from './drawer-sheet';

interface MerchantDrawerClientProps {
  merchant: Merchant;
  /** For moving a name to another merchant */
  merchants: Merchant[];
  categories: Category[];
  transactions: Transaction[];
  period: string;
  /** The transactions are of all time, not of the period */
  allTime: boolean;
  stats: { label: string; value: number }[];
  chart: number[];
  accounts: Account[];
  mainCurrency: string;
}

export function MerchantDrawerClient({
  merchant,
  merchants,
  categories,
  transactions,
  period,
  allTime,
  stats,
  chart,
  accounts,
  mainCurrency,
}: MerchantDrawerClientProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>();
  const color = merchant.category?.color ?? UNCATEGORIZED_COLOR;
  // A transaction can have a category of its own, which these filter by
  const byCategory = groupBy(
    transactions,
    (transaction) =>
      transaction.category?.id ?? (transaction.excluded ? 'excluded' : 'uncategorized'),
  );
  // A filter of a category without transactions in the list, like after a period change, is off
  const filter = categoryFilter && byCategory[categoryFilter] ? categoryFilter : undefined;

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
      stats={stats}
      chart={chart}
      mainCurrency={mainCurrency}
    >
      <Tabs defaultValue="transactions" className="min-h-0 flex-1">
        <TabsList className="mx-4">
          <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
          <TabsTrigger value="names">Names {merchant.keys.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className={TAB_CONTENT}>
          <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
            {allTime ? 'All time' : `In ${formatPeriodLabel(parsePeriod(period))}`}
            <DrawerLink
              to={allTime ? { merchant: merchant.id } : { merchant: merchant.id, history: 'all' }}
              className="hover:text-foreground hover:underline"
            >
              {allTime ? `Show ${formatPeriodLabel(parsePeriod(period))} only` : 'Show all time'}
            </DrawerLink>
          </div>
          {Object.keys(byCategory).length > 1 && (
            <div className="flex flex-wrap gap-1.5 pb-4">
              {Object.entries(byCategory).map(([key, items]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  className={cn(
                    'flex items-center gap-1 rounded-full text-xs text-muted-foreground',
                    filter && filter !== key && 'opacity-50',
                  )}
                  onClick={() => setCategoryFilter(filter === key ? undefined : key)}
                >
                  <CategoryBadge category={items[0].category} excluded={items[0].excluded} />
                  {items.length}
                </button>
              ))}
            </div>
          )}
          <TransactionDayList
            transactions={filter ? byCategory[filter] : transactions}
            accounts={accounts}
            categories={categories}
          />
        </TabsContent>
        <TabsContent value="names" className={TAB_CONTENT}>
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
  const navigate = useNavigate();
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
        navigate(getDrawerHref({ merchant: data.mergedInto.id }));
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
