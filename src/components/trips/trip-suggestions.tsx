import { apiQueries } from '@/server/api/queries';

import { TripSuggestionsClient } from './trip-suggestions-client';

/**
 * Suggests a trip for the days with payments in another currency than usual, so none is forgotten.
 */
export async function TripSuggestions() {
  const [suggestions, categories] = await Promise.all([
    apiQueries.trips.getTripSuggestions(),
    apiQueries.categories.getCategories(),
  ]);
  if (!suggestions.length) {
    return null;
  }

  return <TripSuggestionsClient suggestions={suggestions} categories={categories} />;
}
