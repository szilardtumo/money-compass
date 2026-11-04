import { z } from 'zod';

/** Creates a trip with the transactions, or updates the one with the ID */
export const saveTripSchema = z
  .object({
    id: z.uuid().optional(),
    name: z
      .string()
      .trim()
      .min(1, 'Name is required.')
      .max(100, 'Name must be at most 100 characters.'),
    categoryId: z.uuid().nullable(),
    startDate: z.iso.date('A start date must be selected.'),
    endDate: z.iso.date('An end date must be selected.'),
    transactionIds: z.array(z.uuid()).optional(),
  })
  .refine((trip) => trip.endDate >= trip.startDate, {
    path: ['endDate'],
    message: "The trip can't end before it starts.",
  });

export const setTransactionTripSchema = z.object({
  transactionIds: z.array(z.uuid()).min(1),
  tripId: z.uuid().nullable(),
});
