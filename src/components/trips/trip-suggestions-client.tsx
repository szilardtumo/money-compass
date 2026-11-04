'use client';

import { PlaneIcon } from 'lucide-react';
import { useState } from 'react';

import { useDrawerHref } from '@/components/drawers/drawer-link';
import { useNavigate } from '@/components/navigation-progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category } from '@/lib/types/categories.types';
import { TripSuggestion } from '@/lib/types/trips.types';
import { formatDateRange } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

import { TripDialog } from './trip-dialog';

const SHOWN = 3;

interface TripSuggestionsClientProps {
  /** The latest first */
  suggestions: TripSuggestion[];
  categories: Category[];
}

export function TripSuggestionsClient({ suggestions, categories }: TripSuggestionsClientProps) {
  const navigate = useNavigate();
  const getDrawerHref = useDrawerHref();
  const [creating, setCreating] = useState<TripSuggestion>();
  const { execute: dismiss, isExecuting } = useActionWithToast(
    apiActions.trips.dismissTripSuggestions,
    {
      loadingToast: 'Dismissing...',
      successToast: 'Dismissed!',
      errorToast: 'Failed to dismiss. Please try again later.',
    },
  );

  return (
    <Alert>
      <PlaneIcon />
      <AlertTitle>
        {suggestions.length === 1 ? 'This looks like a trip' : 'These look like trips'}
      </AlertTitle>
      <AlertDescription className="gap-2">
        <ul className="flex w-full flex-col gap-1">
          {suggestions.slice(0, SHOWN).map((suggestion) => (
            <li key={suggestion.startDate} className="flex items-center gap-2">
              <span className="mr-auto">
                {formatDateRange(suggestion.startDate, suggestion.endDate)},{' '}
                {suggestion.transactionIds.length} payments in{' '}
                {suggestion.currencies.map((currency) => currency.toUpperCase()).join(', ')}
              </span>
              <Button size="sm" variant="outline" onClick={() => setCreating(suggestion)}>
                Create trip
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex w-full items-center gap-2">
          {suggestions.length > SHOWN && (
            <span className="mr-auto">and {suggestions.length - SHOWN} earlier</span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            disabled={isExecuting}
            onClick={() => dismiss(suggestions[0].endDate)}
          >
            {suggestions.length === 1 ? 'Dismiss' : 'Dismiss all'}
          </Button>
        </div>
      </AlertDescription>

      <TripDialog
        open={!!creating}
        newTrip={creating}
        categories={categories}
        onClose={() => setCreating(undefined)}
        onSaved={(tripId) => navigate(getDrawerHref({ trip: tripId }))}
      />
    </Alert>
  );
}
