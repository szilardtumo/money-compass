'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { PlaneIcon, PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { useDrawerHref } from '@/components/drawers/drawer-link';
import { useNavigate } from '@/components/navigation-progress';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Category } from '@/lib/types/categories.types';
import { TripSuggestion } from '@/lib/types/trips.types';
import { formatCurrency, formatDateRange } from '@/lib/utils/formatters';
import { apiActions } from '@/server/api/actions';

import { TripDialog } from './trip-dialog';

const SHOWN = 3;

interface TripSuggestionsClientProps {
  /** The latest first */
  suggestions: TripSuggestion[];
  categories: Category[];
  mainCurrency: string;
}

export function TripSuggestionsClient({
  suggestions,
  categories,
  mainCurrency,
}: TripSuggestionsClientProps) {
  const navigate = useNavigate();
  const getDrawerHref = useDrawerHref();
  const [creating, setCreating] = useState<TripSuggestion>();
  const { execute: dismiss, isExecuting } = useActionWithToast(
    apiActions.trips.dismissTripSuggestions,
    {
      loadingToast: 'Hiding suggestions...',
      successToast: 'Suggestions hidden',
      errorToast: 'Failed to hide the suggestions. Please try again later.',
    },
  );
  const hideLabel = suggestions.length === 1 ? 'Not a trip' : 'Hide all suggestions';

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="grid-cols-[auto_1fr] gap-x-3 px-4 has-data-[slot=card-action]:grid-cols-[auto_1fr_auto]">
        <span className="row-span-2 flex size-9 items-center justify-center rounded-md bg-sky-500/15 text-sky-500">
          <PlaneIcon className="size-5" />
        </span>
        <CardTitle>
          {suggestions.length === 1 ? 'Were you away?' : 'Were you away on these days?'}
        </CardTitle>
        <CardDescription>
          You paid in other currencies than usual. Group the days into a trip, so their spending
          counts as one trip instead of in your everyday categories.
        </CardDescription>
        <CardAction className="col-start-3">
          <Button
            variant="ghost"
            size="icon"
            icon={XIcon}
            className="size-7 text-muted-foreground"
            aria-label={hideLabel}
            title={hideLabel}
            disabled={isExecuting}
            onClick={() => dismiss(suggestions[0].endDate)}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="px-4">
        <ul className="divide-y rounded-md border">
          {suggestions.slice(0, SHOWN).map((suggestion) => {
            const days =
              differenceInCalendarDays(
                parseISO(suggestion.endDate),
                parseISO(suggestion.startDate),
              ) + 1;
            return (
              <li key={suggestion.startDate} className="flex items-center gap-3 px-3 py-2">
                <div className="mr-auto min-w-0">
                  <p className="text-sm font-medium">
                    {formatDateRange(suggestion.startDate, suggestion.endDate)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {days} {days === 1 ? 'day' : 'days'} · {suggestion.transactionIds.length}{' '}
                    payments in{' '}
                    {suggestion.currencies.map((currency) => currency.toUpperCase()).join(', ')}
                  </p>
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {formatCurrency(-suggestion.total, mainCurrency, { maximumFractionDigits: 0 })}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  icon={PlusIcon}
                  onClick={() => setCreating(suggestion)}
                >
                  Create trip
                </Button>
              </li>
            );
          })}
        </ul>
        {suggestions.length > SHOWN && (
          <p className="pt-2 text-xs text-muted-foreground">
            And {suggestions.length - SHOWN} older ones
          </p>
        )}
      </CardContent>

      <TripDialog
        open={!!creating}
        newTrip={creating}
        categories={categories}
        onClose={() => setCreating(undefined)}
        onSaved={(tripId) => navigate(getDrawerHref({ trip: tripId }))}
      />
    </Card>
  );
}
