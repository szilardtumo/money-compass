'use client';

import type { NewTripValues } from '@/components/trips/trip-dialog';
import { createDialogContext } from '@/lib/create-dialog-context';

const { Provider: AddToTripDialogProvider, useDialog: useAddToTripDialog } =
  createDialogContext<NewTripValues>('addToTrip');

export { AddToTripDialogProvider, useAddToTripDialog };
