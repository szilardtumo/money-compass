'use client';

import { ChevronRightIcon, EllipsisIcon, PencilIcon, TagIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CategoryIcon, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { CategoryDialog } from '@/components/categories/category-dialog';
import { DeleteCategoryDialog } from '@/components/categories/delete-category-dialog';
import { DrawerLink, useDrawerHref } from '@/components/drawers/drawer-link';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { CATEGORY_KINDS, CategoryMerchant, CategoryWithStats } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { formatCurrency } from '@/lib/utils/formatters';

import { DrawerSheet } from './drawer-sheet';

interface CategoryDrawerClientProps {
  /** null for the uncategorized transactions */
  category: CategoryWithStats | null;
  categories: CategoryWithStats[];
  merchants: CategoryMerchant[];
  transactions: Transaction[];
  monthlyTotals: number[];
  accounts: Account[];
  mainCurrency: string;
}

export function CategoryDrawerClient({
  category,
  categories,
  merchants,
  transactions,
  monthlyTotals,
  accounts,
  mainCurrency,
}: CategoryDrawerClientProps) {
  const router = useRouter();
  const getDrawerHref = useDrawerHref();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const largest = Math.max(...merchants.map((merchant) => Math.abs(merchant.total)));
  const activeMerchants = merchants.filter((merchant) => merchant.transactionCount);
  const inactiveMerchants = merchants.filter((merchant) => !merchant.transactionCount);
  const renderMerchants = (items: CategoryMerchant[]) => (
    <ul className="flex flex-col divide-y">
      {items.map((merchant) => (
        <li key={merchant.id}>
          <DrawerLink
            to={{ merchant: merchant.id }}
            className="flex items-center gap-3 py-2 text-sm hover:bg-muted/50"
          >
            <span className="w-40 truncate">{merchant.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${largest > 0 ? (Math.abs(merchant.total) / largest) * 100 : 0}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="w-10 text-right text-muted-foreground">
              {merchant.transactionCount}×
            </span>
            <span className="w-20 text-right font-medium">
              {formatCurrency(merchant.total, mainCurrency, { maximumFractionDigits: 0 })}
            </span>
          </DrawerLink>
        </li>
      ))}
    </ul>
  );

  return (
    <DrawerSheet
      icon={
        category ? (
          <CategoryIcon category={category} className="size-5" />
        ) : (
          <TagIcon className="size-5" style={{ color }} />
        )
      }
      color={color}
      title={category?.name ?? 'Uncategorized'}
      description={
        category
          ? CATEGORY_KINDS.find((item) => item.kind === category.kind)?.label
          : 'Merchants and transactions without a category'
      }
      actions={
        category && (
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
        )
      }
      monthlyTotals={monthlyTotals}
      mainCurrency={mainCurrency}
    >
      <Tabs defaultValue="merchants" className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="merchants">Merchants {activeMerchants.length}</TabsTrigger>
            <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
          </TabsList>
          <span className="text-xs text-muted-foreground">Last 12 months</span>
        </div>
        <TabsContent value="merchants">
          {activeMerchants.length ? (
            renderMerchants(activeMerchants)
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No merchants with transactions in the last 12 months.
            </p>
          )}
          {inactiveMerchants.length > 0 && (
            <details className="group mt-2">
              <summary className="flex cursor-pointer list-none items-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground">
                <ChevronRightIcon className="size-4 transition-transform group-open:rotate-90" />
                {inactiveMerchants.length} without transactions in the last 12 months
              </summary>
              {renderMerchants(inactiveMerchants)}
            </details>
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

      {category && (
        <>
          <CategoryDialog
            open={isEditing}
            category={category}
            onClose={() => setIsEditing(false)}
          />
          <DeleteCategoryDialog
            category={isDeleting ? category : undefined}
            categories={categories}
            onClose={() => setIsDeleting(false)}
            onDeleted={() => router.push(getDrawerHref(null), { scroll: false })}
          />
        </>
      )}
    </DrawerSheet>
  );
}
