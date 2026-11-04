import { eq, sql } from 'drizzle-orm';
import { date, index, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';

import { categories } from './categories.schema';
import { authUid, authUidDefault } from './utils';

// A group of transactions, like the bookings, payments abroad and settle-ups of a holiday
export const trips = pgTable(
  'trips',
  {
    id: uuid().notNull().defaultRandom().primaryKey(),
    userId: uuid().notNull().default(authUidDefault),
    name: text().notNull(),
    // Its transactions count in it, unless they have a category of their own
    categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
    // When the trip itself was, while its bookings can be weeks earlier
    startDate: date({ mode: 'string' }).notNull(),
    endDate: date({ mode: 'string' }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index().on(table.userId, table.startDate.desc()),
    index().on(table.categoryId),
    pgPolicy('trips_allow_all_for_owner_policy', {
      as: 'permissive',
      for: 'all',
      to: authenticatedRole,
      using: eq(table.userId, authUid),
      withCheck: sql`${eq(table.userId, authUid)} AND (${table.categoryId} IS NULL OR EXISTS (SELECT 1 FROM ${categories} WHERE ${categories.id} = ${table.categoryId} AND ${categories.userId} = ${authUid}))`,
    }),
  ],
);
