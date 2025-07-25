import { z } from 'zod';

const createSubaccountSchema = z.object({
  name: z.string().min(1, 'Subaccount name is required'),
  originalCurrency: z.string().min(1, 'A currency must be selected.'),
  delete: z.never().optional(),
});

const updateSubaccountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Subaccount name is required'),
  originalCurrency: z.string().min(1, 'A currency must be selected.'),
  delete: z.literal(true).optional(),
});

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(2, 'Account name must be at least 2 characters.')
    .max(50, 'Account name must be at most 50 characters.'),
  category: z.enum(['checking', 'investment'], 'An account category must be selected.'),
  subaccounts: z.array(createSubaccountSchema).optional().default([]),
});

export const updateAccountSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(2, 'Account name must be at least 2 characters.')
    .max(50, 'Account name must be at most 50 characters.'),
  category: z.enum(['checking', 'investment'], 'An account category must be selected.'),
  subaccounts: z
    // order is important here, we want to match updateSubaccountSchema first
    .array(z.union([updateSubaccountSchema, createSubaccountSchema]))
    .optional()
    .default([]),
});
