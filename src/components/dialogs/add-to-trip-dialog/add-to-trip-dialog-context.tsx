'use client';

import type { NewTripValues } from '@/components/trips/trip-dialog';
import { createDialogContext } from '@/lib/create-dialog-context';

type DefaultValues = Required<Pick<NewTripValues, 'transactionIds' | 'startDate' | 'endDate'>>;

const { Provider: AddToTripDialogProvider, useDialog: useAddToTripDialog } =
  createDialogContext<DefaultValues>('addToTrip');

export { AddToTripDialogProvider, useAddToTripDialog };
