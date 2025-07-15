import { isFuture } from 'date-fns';
import { z } from 'zod';

const commonTransactionSchema = z.object({
  type: z.string('A transaction type must be selected.'),
  amount: z.number(),
  description: z.string().trim().min(1, 'Description is required'),
  date: z.date().refine((date) => !isFuture(date), 'Date cannot be in the future.'),
});

export const createTransactionSchema = z.object({
  accountId: z.uuid('An account must be selected.'),
  subaccountId: z.uuid('A subaccount must be selected.'),
  ...commonTransactionSchema.shape,
});

export const updateTransactionSchema = z.object({
  id: z.uuid(),
  ...commonTransactionSchema.shape,
});

export const updateBalancesSchema = z.object({
  balances: z.record(z.uuid(), commonTransactionSchema.shape.amount),
  description: commonTransactionSchema.shape.description,
  date: commonTransactionSchema.shape.date,
});

export const deleteTransactionsSchema = z.object({
  transactionIds: z.array(z.uuid()).min(1),
});
