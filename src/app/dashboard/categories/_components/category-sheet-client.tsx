'use client';

import { EllipsisIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CategoryIcon } from '@/components/categories/category-badge';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Sparkline } from '@/components/ui/sparkline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { CATEGORY_KINDS, CategoryMerchant, CategoryWithStats } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { formatCurrency } from '@/lib/utils/formatters';

import { CategoryDialog } from './category-dialog';
import { DeleteCategoryDialog } from './delete-category-dialog';

interface CategorySheetClientProps {
  category: CategoryWithStats;
  categories: CategoryWithStats[];
  merchants: CategoryMerchant[];
  transactions: Transaction[];
  accounts: Account[];
  mainCurrency: string;
}

export function CategorySheetClient({
  category,
  categories,
  merchants,
  transactions,
  accounts,
  mainCurrency,
}: CategorySheetClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const format = (value: number) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0 });
  const largest = Math.max(...merchants.map((merchant) => merchant.total), 0);
  const isCounted = category.kind !== 'excluded';

  return (
    <Sheet open onOpenChange={() => router.push('/dashboard/categories', { scroll: false })}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pr-12">
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-md"
              style={{ backgroundColor: `color-mix(in srgb, ${category.color} 18%, transparent)` }}
            >
              <CategoryIcon category={category} className="size-5" />
            </span>
            <div className="mr-auto">
              <SheetTitle>{category.name}</SheetTitle>
              <SheetDescription>
                {CATEGORY_KINDS.find((item) => item.kind === category.kind)?.label}
              </SheetDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Category actions">
                  <EllipsisIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <PencilIcon className="size-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleting(true)}>
                  <Trash2Icon className="size-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isCounted && (
            <div className="mt-4 flex items-end gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Last 12 months</p>
                <p className="text-xl font-semibold">{format(category.yearTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly average</p>
                <p className="text-xl font-semibold">{format(category.yearTotal / 12)}</p>
              </div>
              <div className="ml-auto">
                <Sparkline
                  values={category.monthlyTotals}
                  color={category.color}
                  width={168}
                  height={40}
                />
              </div>
            </div>
          )}
        </SheetHeader>

        <Tabs defaultValue="merchants" className="px-4 pb-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="merchants">Merchants {merchants.length}</TabsTrigger>
              <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
            </TabsList>
            <span className="text-xs text-muted-foreground">Last 12 months</span>
          </div>
          <TabsContent value="merchants">
            {merchants.length ? (
              <ul className="flex flex-col divide-y">
                {merchants.map((merchant) => (
                  <li key={merchant.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-40 truncate">{merchant.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${largest > 0 ? (Math.max(merchant.total, 0) / largest) * 100 : 0}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-muted-foreground">
                      {merchant.transactionCount}×
                    </span>
                    <span className="w-20 text-right font-medium">
                      {isCounted ? format(merchant.total) : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No merchants in this category.
              </p>
            )}
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionDayList
              transactions={transactions}
              accounts={accounts}
              categories={categories}
            />
          </TabsContent>
        </Tabs>

        <CategoryDialog open={isEditing} category={category} onClose={() => setIsEditing(false)} />
        <DeleteCategoryDialog
          category={isDeleting ? category : undefined}
          categories={categories}
          onClose={() => setIsDeleting(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
