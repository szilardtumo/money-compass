'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { TripDialog } from '@/components/trips/trip-dialog';
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
  const { execute } = useActionWithToast(apiActions.trips.setTransactionTrip, {
    loadingToast: 'Adding to trip...',
    successToast: 'Added to trip!',
    errorToast: 'Failed to add to the trip. Please try again later.',
  });
  const values = internal.defaultValues;
  if (!values) {
    return null;
  }
  const count = values.transactionIds.length;

  return (
    <>
      <Dialog open={isOpen && !isCreating} onOpenChange={internal.setIsOpen}>
        <DialogContent className="p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>
              Add {count === 1 ? 'the transaction' : `${count} transactions`} to a trip
            </DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Search trips..." className="h-9" />
            <CommandList>
              <CommandEmpty>No trip found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="new trip" onSelect={() => setIsCreating(true)}>
                  <PlusIcon className="size-4" /> New trip
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Trips">
                {trips.map((trip) => (
                  <CommandItem
                    key={trip.id}
                    value={`${trip.name} ${trip.id}`}
                    onSelect={() => {
                      execute({ transactionIds: values.transactionIds, tripId: trip.id });
                      internal.setIsOpen(false);
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
