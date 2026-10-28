'use client';

import { formatDistanceToNow } from 'date-fns';
import { useSyncExternalStore } from 'react';

import { formatDateTime } from '@/lib/utils/formatters';

const subscribe = () => () => {};

export function RelativeTime({ date }: { date: Date }) {
  // The server doesn't know the browser's time zone, so the exact time is formatted after hydration
  const isBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    // The server and the browser can render a different minute
    <time
      dateTime={date.toISOString()}
      title={isBrowser ? formatDateTime(date) : undefined}
      suppressHydrationWarning
    >
      {formatDistanceToNow(date, { addSuffix: true })}
    </time>
  );
}
