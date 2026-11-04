import { apiQueries } from '@/server/api/queries';

import { AddToTripDialogClient } from './add-to-trip-dialog-client';

export async function AddToTripDialog() {
  const [trips, categories] = await Promise.all([
    apiQueries.trips.getTrips(),
    apiQueries.categories.getCategories(),
  ]);

  return <AddToTripDialogClient trips={trips} categories={categories} />;
}
