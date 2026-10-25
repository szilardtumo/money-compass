'use client';

import { formatDistanceToNow } from 'date-fns';

import { formatDateTime } from '@/lib/utils/formatters';

export function RelativeTime({ date }: { date: Date }) {
  return (
    // The server and the browser can render a different minute
    <time dateTime={date.toISOString()} title={formatDateTime(date)} suppressHydrationWarning>
      {formatDistanceToNow(date, { addSuffix: true })}
    </time>
  );
}
