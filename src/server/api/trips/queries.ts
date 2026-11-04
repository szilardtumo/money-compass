import 'server-only';

import { desc, eq, isNotNull, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import { Trip } from '@/lib/types/trips.types';
import { toMainCurrency } from '@/lib/utils/currencies';
import { schema } from '@/server/db';

import { analyticsSide, joinCategory } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';

const t = schema.transactions;
const tripCategory = alias(schema.categories, 'trip_category');
// The category without the trip: the transaction's own, else its merchant's
const baseCategory = alias(schema.categories, 'base_category');

/**
 * Returns the trips of the user, the latest first, with their totals in the main currency.
 */
export const getTrips = createApiQuery<void, Trip[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  const [trips, rows, { mapper }] = await Promise.all([
    db.rls((tx) =>
      tx
        .select({
          id: schema.trips.id,
          name: schema.trips.name,
          category: {
            id: tripCategory.id,
            name: tripCategory.name,
            kind: tripCategory.kind,
            icon: tripCategory.icon,
            color: tripCategory.color,
          },
          startDate: schema.trips.startDate,
          endDate: schema.trips.endDate,
        })
        .from(schema.trips)
        .leftJoin(tripCategory, eq(tripCategory.id, schema.trips.categoryId))
        .orderBy(desc(schema.trips.startDate), desc(schema.trips.createdAt)),
    ),
    db.rls((tx) =>
      joinCategory(
        tx
          .select({
            tripId: t.tripId,
            side: analyticsSide.as('side'),
            baseCategory: {
              id: baseCategory.id,
              name: baseCategory.name,
              kind: baseCategory.kind,
              icon: baseCategory.icon,
              color: baseCategory.color,
            },
            currency: schema.subaccounts.currency,
            amount: sum(t.amount).mapWith(Number),
            transactionCount: sql<number>`count(*)`.mapWith(Number),
          })
          .from(t)
          .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
          .$dynamic(),
      )
        .leftJoin(
          baseCategory,
          eq(baseCategory.id, sql`coalesce(${t.categoryId}, ${schema.merchants.categoryId})`),
        )
        .where(isNotNull(t.tripId))
        .groupBy(t.tripId, sql`side`, baseCategory.id, schema.subaccounts.currency),
    ),
    getMainCurrencyWithMapper(),
  ]);

  const result = new Map<string, Trip & { totals: Map<string | null, Trip['breakdown'][number]> }>(
    trips.map((trip) => [
      trip.id,
      { ...trip, transactionCount: 0, total: 0, breakdown: [], totals: new Map() },
    ]),
  );
  for (const row of rows) {
    const trip = result.get(row.tripId!)!;
    trip.transactionCount += row.transactionCount;
    if (row.side === 'excluded') {
      continue;
    }
    const amount = toMainCurrency(row, mapper);
    trip.total += amount;
    const item = trip.totals.get(row.baseCategory?.id ?? null) ?? {
      category: row.baseCategory,
      total: 0,
    };
    trip.totals.set(row.baseCategory?.id ?? null, item);
    item.total += amount;
  }

  return [...result.values()].map(({ totals, ...trip }) => ({
    ...trip,
    breakdown: [...totals.values()].toSorted((a, b) => a.total - b.total),
  }));
});
