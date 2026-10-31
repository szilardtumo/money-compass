'use client';

import { ChevronRightIcon } from 'lucide-react';

import { CategoryActions } from '@/components/categories/category-actions';
import { CategoryIcon, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { DrawerLink } from '@/components/drawers/drawer-link';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
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
  period: string | undefined;
  total: number;
  monthlyTotals: number[];
  accounts: Account[];
  mainCurrency: string;
}

export function CategoryDrawerClient({
  category,
  categories,
  merchants,
  transactions,
  period,
  total,
  monthlyTotals,
  accounts,
  mainCurrency,
}: CategoryDrawerClientProps) {
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
      icon={<CategoryIcon category={category ?? { icon: 'tag', color }} className="size-5" />}
      color={color}
      title={category?.name ?? 'Uncategorized'}
      description={
        category
          ? CATEGORY_KINDS.find((item) => item.kind === category.kind)?.label
          : 'Merchants and transactions without a category'
      }
      actions={category && <CategoryActions category={category} categories={categories} />}
      period={period}
      total={total}
      monthlyTotals={monthlyTotals}
      mainCurrency={mainCurrency}
    >
      <Tabs defaultValue="merchants" className="px-4 pb-4">
        <TabsList>
          <TabsTrigger value="merchants">Merchants {activeMerchants.length}</TabsTrigger>
          <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="merchants">
          {activeMerchants.length ? (
            renderMerchants(activeMerchants)
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No merchants with transactions in this period.
            </p>
          )}
          {inactiveMerchants.length > 0 && (
            <details className="group mt-2">
              <summary className="flex cursor-pointer list-none items-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground">
                <ChevronRightIcon className="size-4 transition-transform group-open:rotate-90" />
                {inactiveMerchants.length} without transactions in this period
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
    </DrawerSheet>
  );
}
