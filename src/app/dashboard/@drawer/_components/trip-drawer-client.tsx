'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { EllipsisVerticalIcon, PencilIcon, PlaneIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { CategoryBadge, UNCATEGORIZED_COLOR } from '@/components/categories/category-badge';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { useNavigate } from '@/components/navigation-progress';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { ADD_TO_TRIP_TOASTS, TripDialog } from '@/components/trips/trip-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { Category } from '@/lib/types/categories.types';
import { Transaction } from '@/lib/types/transactions.types';
import { Trip } from '@/lib/types/trips.types';
import { formatCurrency, formatDateRange } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

import { DrawerSheet, TAB_CONTENT } from './drawer-sheet';

interface TripDrawerClientProps {
  trip: Trip;
  categories: Category[];
  transactions: Transaction[];
  /** Without a trip, around the trip's days */
  suggested: Transaction[];
  accounts: Account[];
  mainCurrency: string;
}

export function TripDrawerClient({
  trip,
  categories,
  transactions,
  suggested,
  accounts,
  mainCurrency,
}: TripDrawerClientProps) {
  const navigate = useNavigate();
  const getDrawerHref = useDrawerHref();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { execute: deleteTrip } = useActionWithToast(apiActions.trips.deleteTrip, {
    loadingToast: 'Deleting trip...',
    successToast: 'Trip deleted!',
    errorToast: 'Failed to delete the trip. Please try again later.',
    onSuccess: () => navigate(getDrawerHref(null)),
  });
  const { execute: addToTrip } = useActionWithToast(
    apiActions.trips.setTransactionTrip,
    ADD_TO_TRIP_TOASTS,
  );
  const add = (items: Transaction[]) =>
    addToTrip({ transactionIds: items.map((item) => item.id), tripId: trip.id });
  const color = trip.category?.color ?? UNCATEGORIZED_COLOR;
  const days = differenceInCalendarDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1;

  return (
    <DrawerSheet
      icon={<PlaneIcon className="size-5" style={{ color }} />}
      color={color}
      title={trip.name}
      description={
        <span className="flex items-center gap-2">
          {formatDateRange(trip.startDate, trip.endDate)}
          {trip.category && <CategoryBadge category={trip.category} />}
        </span>
      }
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              icon={EllipsisVerticalIcon}
              aria-label="Trip actions"
              className="h-6 w-5 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            />
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
      }
      // Spending is negative
      stats={[
        { label: 'Cost', value: -trip.total },
        { label: `Per day, ${days} ${days === 1 ? 'day' : 'days'}`, value: -trip.total / days },
      ]}
      mainCurrency={mainCurrency}
    >
      <Tabs defaultValue="transactions" className="min-h-0 flex-1">
        <TabsList className="mx-4">
          <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
          <TabsTrigger value="categories">Categories {trip.breakdown.length}</TabsTrigger>
          <TabsTrigger value="suggested">Suggested {suggested.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className={TAB_CONTENT}>
          <TransactionDayList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
          />
        </TabsContent>
        <TabsContent value="categories" className={TAB_CONTENT}>
          <p className="py-2 text-xs text-muted-foreground">
            The cost by the categories the transactions would have without the trip
          </p>
          <ul className="flex flex-col divide-y">
            {trip.breakdown.map((item) => (
              <li key={item.category?.id ?? 'none'} className="flex items-center py-2 text-sm">
                <CategoryBadge category={item.category} className="mr-auto" />
                <span className="font-medium">{formatCurrency(-item.total, mainCurrency)}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="suggested" className={TAB_CONTENT}>
          <div className="flex items-center justify-between gap-2 py-2 text-xs text-muted-foreground">
            Without a trip: the trip&apos;s days, transfers of the 14 days after it, and its
            category in the 60 days before it
            {suggested.length > 1 && (
              <Button size="sm" variant="outline" onClick={() => add(suggested)}>
                Add all
              </Button>
            )}
          </div>
          <TransactionDayList
            transactions={suggested}
            accounts={accounts}
            categories={categories}
            action={(transaction) => (
              <Button
                variant="ghost"
                size="icon"
                icon={PlusIcon}
                aria-label={`Add to ${trip.name}`}
                title={`Add to ${trip.name}`}
                className="size-6 shrink-0"
                onClick={() => add([transaction])}
              />
            )}
          />
        </TabsContent>
      </Tabs>

      <TripDialog
        open={isEditing}
        trip={trip}
        categories={categories}
        onClose={() => setIsEditing(false)}
      />
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {trip.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Its transactions stay, without a trip, and count in their merchants&apos; categories
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteTrip(trip.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DrawerSheet>
  );
}
