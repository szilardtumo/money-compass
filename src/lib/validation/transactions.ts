import { isFuture } from 'date-fns';
import { z } from 'zod';

const commonTransactionSchema = z.object({
  type: z.string({ required_error: 'A transaction type must be selected.' }),
  amount: z.coerce.number(),
  description: z.string().trim().min(1, 'Description is required'),
  date: z.date().refine((date) => !isFuture(date), { message: 'Date cannot be in the future.' }),
});

export const createTransactionSchema = z.object({
  accountId: z.string({ required_error: 'An account must be selected.' }).uuid(),
  subaccountId: z.string({ required_error: 'A subaccount must be selected.' }).uuid(),
  ...commonTransactionSchema.shape,
});

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  ...commonTransactionSchema.shape,
});

export const updateBalancesSchema = z.object({
  balances: z.record(z.string().uuid(), commonTransactionSchema.shape.amount),
  description: commonTransactionSchema.shape.description,
  date: commonTransactionSchema.shape.date,
});

export const deleteTransactionsSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1),
});
