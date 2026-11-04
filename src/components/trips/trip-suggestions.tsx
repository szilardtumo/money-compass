import { apiQueries } from '@/server/api/queries';

import { TripSuggestionsClient } from './trip-suggestions-client';

/**
 * Suggests a trip for the days with payments in another currency than usual, so none is forgotten.
 */
export async function TripSuggestions() {
  const [suggestions, categories, profile] = await Promise.all([
    apiQueries.trips.getTripSuggestions(),
    apiQueries.categories.getCategories(),
    apiQueries.profiles.getProfile(),
  ]);
  if (!suggestions.length) {
    return null;
  }
  const shown = suggestions.slice(0, 3);
  const places = await Promise.all(
    shown.map((suggestion) =>
      apiQueries.trips.getTripPlace({ transactionIds: suggestion.transactionIds }),
    ),
  );

  return (
    <TripSuggestionsClient
      suggestions={shown.map((suggestion, index) => ({
        ...suggestion,
        name: places[index] ?? undefined,
      }))}
      olderCount={suggestions.length - shown.length}
      categories={categories}
      mainCurrency={profile.mainCurrency}
    />
  );
}
