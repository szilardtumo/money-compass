'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';

import { CategoryBadge } from '@/components/categories/category-badge';
import { CategoryPicker } from '@/components/categories/category-picker';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useHookFormActionWithToast } from '@/hooks/useActionWithToast';
import { Category } from '@/lib/types/categories.types';
import { Trip, TripSuggestion } from '@/lib/types/trips.types';
import { saveTripSchema } from '@/lib/validation/trips';
import { apiActions } from '@/server/api/actions';

export const ADD_TO_TRIP_TOASTS = {
  loadingToast: 'Adding to trip...',
  successToast: 'Added to trip!',
  errorToast: 'Failed to add to the trip. Please try again later.',
};

/** The days and transactions a new trip starts with */
export type NewTripValues = Omit<TripSuggestion, 'currencies'>;

interface TripDialogProps {
  open: boolean;
  /** The trip to edit, else a new one */
  trip?: Trip;
  newTrip?: NewTripValues;
  categories: Category[];
  onClose: () => void;
  onSaved?: (tripId: string) => void;
}

export function TripDialog({ open, onClose, ...props }: TripDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>{open && <TripForm onClose={onClose} {...props} />}</DialogContent>
    </Dialog>
  );
}

function TripForm({ trip, newTrip, categories, onClose, onSaved }: Omit<TripDialogProps, 'open'>) {
  const { form, handleSubmitWithAction } = useHookFormActionWithToast(
    apiActions.trips.saveTrip,
    zodResolver(saveTripSchema),
    {
      actionProps: {
        loadingToast: 'Saving trip...',
        successToast: 'Trip saved!',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to save the trip',
          description: errorMessage,
        }),
        onSuccess: ({ data }) => {
          onClose();
          if (data) {
            onSaved?.(data.id);
          }
        },
      },
      formProps: {
        defaultValues: trip
          ? {
              id: trip.id,
              name: trip.name,
              categoryId: trip.category?.id ?? null,
              startDate: trip.startDate,
              endDate: trip.endDate,
            }
          : {
              name: '',
              categoryId: categories.find((category) => category.name === 'Travel')?.id ?? null,
              ...newTrip,
            },
      },
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>
            {trip
              ? 'Edit trip'
              : newTrip
                ? `New trip with ${newTrip.transactionIds.length === 1 ? 'the transaction' : `${newTrip.transactionIds.length} transactions`}`
                : 'New trip'}
          </DialogTitle>
        </DialogHeader>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Athens" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          {(['startDate', 'endDate'] as const).map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{name === 'startDate' ? 'From' : 'To'}</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={value ? parseISO(value) : undefined}
                      onValueChange={(date) => onChange(date && format(date, 'yyyy-MM-dd'))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <CategoryPicker
                categories={categories}
                value={field.value}
                onSelect={field.onChange}
                clearLabel="No category"
              >
                <FormControl>
                  <Button type="button" variant="outline" className="justify-start">
                    {field.value ? (
                      <CategoryBadge
                        category={categories.find((category) => category.id === field.value)!}
                      />
                    ) : (
                      <span className="text-muted-foreground">No category</span>
                    )}
                  </Button>
                </FormControl>
              </CategoryPicker>
              <FormDescription>
                Its transactions count in it, unless they have a category of their own. Without one,
                they keep their merchants&apos; categories.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            isLoading={form.formState.isSubmitting}
          >
            Save
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
