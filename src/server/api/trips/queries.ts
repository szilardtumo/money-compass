import 'server-only';

import { addDays, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { and, count, desc, eq, gt, gte, isNotNull, isNull, lt, ne, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createApiContext, createApiQuery } from '@/lib/api';
import { Transaction } from '@/lib/types/transactions.types';
import { Trip, TripSuggestion } from '@/lib/types/trips.types';
import { toMainCurrency } from '@/lib/utils/currencies';
import { schema } from '@/server/db';

import { analyticsSide, categoryColumns, joinCategory } from '../categories/joins';
import { getMainCurrencyWithMapper } from '../currencies/queries';
import { getTransactions } from '../transactions/queries';

const t = schema.transactions;
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
          category: categoryColumns,
          startDate: schema.trips.startDate,
          endDate: schema.trips.endDate,
        })
        .from(schema.trips)
        .leftJoin(schema.categories, eq(schema.categories.id, schema.trips.categoryId))
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

  const result = new Map(
    trips.map((trip) => [
      trip.id,
      {
        ...trip,
        transactionCount: 0,
        total: 0,
        breakdown: new Map<string | null, Trip['breakdown'][number]>(),
      },
    ]),
  );
  for (const row of rows) {
    const trip = result.get(row.tripId!);
    // A trip created between the two reads
    if (!trip) {
      continue;
    }
    trip.transactionCount += row.transactionCount;
    if (row.side === 'excluded') {
      continue;
    }
    const amount = toMainCurrency(row, mapper);
    const key = row.baseCategory?.id ?? null;
    const item = trip.breakdown.get(key) ?? { category: row.baseCategory, total: 0 };
    trip.breakdown.set(key, item);
    item.total += amount;
    trip.total += amount;
  }

  return [...result.values()].map((trip) => ({
    ...trip,
    breakdown: [...trip.breakdown.values()].toSorted((a, b) => a.total - b.total),
  }));
});

/**
 * Returns the days that look like a trip without one, the latest first: days outside every trip
 * with at least 3 card payments without a trip in other currencies than most payments of the last
 * 90 days. Days with at most one day between them make one suggestion. The ones the user dismissed
 * are left out.
 */
export const getTripSuggestions = createApiQuery<void, TripSuggestion[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const currency = schema.subaccounts.currency;
  const day = sql<string>`to_char(${t.startedDate} at time zone 'UTC', 'YYYY-MM-DD')`;
  const isPayment = and(eq(t.type, 'card_payment'), lt(t.amount, 0));

  const [days, { mapper }] = await Promise.all([
    db.rls(async (tx) => {
      const [home] = await tx
        .select({ currency })
        .from(t)
        .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
        // Without trips, so a long one abroad doesn't make its currency the usual one
        .where(and(isPayment, isNull(t.tripId), gte(t.startedDate, subDays(new Date(), 90))))
        .groupBy(currency)
        .orderBy(desc(count()))
        .limit(1);
      if (!home) {
        return [];
      }
      const profile = await tx.query.profiles.findFirst();
      const dismissedUntil = profile?.tripSuggestionsDismissedUntil;

      return tx
        .select({
          day: day.as('day'),
          payments: sql<
            { id: string; currency: string; amount: number }[]
          >`json_agg(json_build_object('id', ${t.id}, 'currency', ${currency}, 'amount', ${t.amount}))`,
        })
        .from(t)
        .innerJoin(schema.subaccounts, eq(schema.subaccounts.id, t.subaccountId))
        .where(
          and(
            isPayment,
            isNull(t.tripId),
            sql`not exists (select 1 from ${schema.trips} where ${day}::date between ${schema.trips.startDate} and ${schema.trips.endDate})`,
            ne(currency, home.currency),
            dismissedUntil ? gt(day, dismissedUntil) : undefined,
          ),
        )
        .groupBy(sql`day`)
        .having(sql`count(*) >= 3`)
        .orderBy(sql`day`);
    }),
    getMainCurrencyWithMapper(),
  ]);

  const suggestions: TripSuggestion[] = [];
  for (const { day, payments } of days) {
    let last = suggestions.at(-1);
    if (!last || differenceInCalendarDays(parseISO(day), parseISO(last.endDate)) > 2) {
      last = { startDate: day, endDate: day, currencies: [], transactionIds: [], total: 0 };
      suggestions.push(last);
    }
    last.endDate = day;
    for (const payment of payments) {
      if (!last.currencies.includes(payment.currency)) {
        last.currencies.push(payment.currency);
      }
      last.transactionIds.push(payment.id);
      last.total += toMainCurrency(payment, mapper);
    }
  }
  return suggestions.toReversed();
});

/**
 * Returns the transactions without a trip or an income category that may belong to one, the latest
 * first: the ones of its days, the transfers of the 14 days after it, like settle-ups, and the ones
 * in its category of the 60 days before it, like bookings.
 */
export const getTripSuggestedTransactions = createApiQuery<{ tripId: string }, Transaction[]>(
  async ({ input: { tripId } }) => {
    'use cache: private';
    const { db } = await createApiContext();
    const [trip] = await db.rls((tx) =>
      tx.select().from(schema.trips).where(eq(schema.trips.id, tripId)),
    );
    if (!trip) {
      return [];
    }
    // Bank dates are midnights in UTC
    const start = parseISO(`${trip.startDate}T00:00:00Z`);
    const end = parseISO(`${trip.endDate}T00:00:00Z`);
    const until = (date: Date) => new Date(date.getTime() - 1).toISOString();
    const filter = { withoutTrip: true, pageSize: 1000 };

    const results = await Promise.all([
      getTransactions({
        ...filter,
        fromDate: start.toISOString(),
        toDate: until(addDays(end, 1)),
        countedInAnalytics: true,
      }),
      getTransactions({
        ...filter,
        fromDate: addDays(end, 1).toISOString(),
        toDate: until(addDays(end, 15)),
        type: 'transfer',
        countedInAnalytics: true,
      }),
      trip.categoryId
        ? getTransactions({
            ...filter,
            fromDate: subDays(start, 60).toISOString(),
            toDate: until(start),
            categoryId: trip.categoryId,
          })
        : null,
    ]);
    return (
      results
        .flatMap((result) => result?.data ?? [])
        // Income like the salary would turn into trip spending
        .filter((transaction) => transaction.category?.kind !== 'income')
        .toSorted((a, b) => +new Date(b.startedDate) - +new Date(a.startedDate))
    );
  },
);
