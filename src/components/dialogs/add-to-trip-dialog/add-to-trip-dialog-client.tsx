'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { ADD_TO_TRIP_TOASTS, TripDialog } from '@/components/trips/trip-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category } from '@/lib/types/categories.types';
import { Trip } from '@/lib/types/trips.types';
import { formatDateRange } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

import { useAddToTripDialog } from './add-to-trip-dialog-context';

/**
 * Moves transactions to a trip, or to a new one with their dates.
 */
export function AddToTripDialogClient({
  trips,
  categories,
}: {
  trips: Trip[];
  categories: Category[];
}) {
  const { isOpen, internal } = useAddToTripDialog();
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const { execute } = useActionWithToast(apiActions.trips.setTransactionTrip, ADD_TO_TRIP_TOASTS);
  const values = internal.defaultValues;
  if (!values) {
    return null;
  }
  const count = values.transactionIds.length;
  // The dialog stays mounted, so the next one starts with an empty search
  const close = () => {
    internal.setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      <Dialog open={isOpen && !isCreating} onOpenChange={close}>
        <DialogContent className="p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>
              Add {count === 1 ? 'the transaction' : `${count} transactions`} to a trip
            </DialogTitle>
          </DialogHeader>
          {/* Filtered here, so trips with the same name and dates can have their IDs as values */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search trips..."
              className="h-9"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No trip found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="new trip" onSelect={() => setIsCreating(true)}>
                  <PlusIcon className="size-4" /> New trip
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Trips">
                {trips
                  .filter((trip) =>
                    `${trip.name} ${formatDateRange(trip.startDate, trip.endDate)}`
                      .toLowerCase()
                      .includes(search.trim().toLowerCase()),
                  )
                  .map((trip) => (
                    <CommandItem
                      key={trip.id}
                      value={trip.id}
                      onSelect={() => {
                        execute({ transactionIds: values.transactionIds, tripId: trip.id });
                        close();
                      }}
                    >
                      <span className="truncate">{trip.name}</span>
                      <span className="ml-auto text-xs whitespace-nowrap text-muted-foreground">
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <TripDialog
        open={isOpen && isCreating}
        newTrip={values}
        categories={categories}
        onClose={() => {
          setIsCreating(false);
          internal.setIsOpen(false);
        }}
      />
    </>
  );
}
