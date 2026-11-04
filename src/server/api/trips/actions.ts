'use server';

import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authenticatedActionClient } from '@/lib/api';
import { saveTripSchema, setTransactionTripSchema } from '@/lib/validation/trips';
import { schema } from '@/server/db';

/**
 * Creates a trip with the transactions, or updates the one with the given ID.
 *
 * @returns The ID of the trip
 */
export const saveTrip = authenticatedActionClient
  .inputSchema(saveTripSchema)
  .action(async ({ parsedInput: { id, transactionIds, ...values }, ctx }) => {
    const tripId = await ctx.db.rls(async (tx) => {
      if (id) {
        await tx.update(schema.trips).set(values).where(eq(schema.trips.id, id));
        return id;
      }

      const [trip] = await tx
        .insert(schema.trips)
        .values(values)
        .returning({ id: schema.trips.id });
      if (transactionIds?.length) {
        await tx
          .update(schema.transactions)
          .set({ tripId: trip.id })
          .where(inArray(schema.transactions.id, transactionIds));
      }
      return trip.id;
    });

    revalidatePath('/dashboard', 'layout');
    return { id: tripId };
  });

/**
 * Deletes a trip. Its transactions stay, without a trip.
 */
export const deleteTrip = authenticatedActionClient
  .inputSchema(z.uuid())
  .action(async ({ parsedInput: id, ctx }) => {
    await ctx.db.rls((tx) => tx.delete(schema.trips).where(eq(schema.trips.id, id)));

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Moves the transactions to a trip, or out of their trip for null.
 */
export const setTransactionTrip = authenticatedActionClient
  .inputSchema(setTransactionTripSchema)
  .action(async ({ parsedInput: { transactionIds, tripId }, ctx }) => {
    await ctx.db.rls((tx) =>
      tx
        .update(schema.transactions)
        .set({ tripId })
        .where(inArray(schema.transactions.id, transactionIds)),
    );

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Hides the trip suggestions up to the day.
 */
export const dismissTripSuggestions = authenticatedActionClient
  .inputSchema(z.iso.date())
  .action(async ({ parsedInput: until, ctx }) => {
    await ctx.db.rls((tx) =>
      tx
        .insert(schema.profiles)
        .values({ id: ctx.userId, tripSuggestionsDismissedUntil: until })
        .onConflictDoUpdate({
          target: schema.profiles.id,
          set: { tripSuggestionsDismissedUntil: until },
        }),
    );

    revalidatePath('/dashboard', 'layout');
  });
