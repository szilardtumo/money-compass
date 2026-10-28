import { z } from 'zod';

const categoryFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(50, 'Name must be at most 50 characters.'),
  kind: z.enum(['expense', 'income', 'excluded'], 'A type must be selected.'),
};

export const createCategorySchema = z.object(categoryFields);

export const updateCategorySchema = z.object({ id: z.uuid(), ...categoryFields });

export const deleteCategorySchema = z.object({
  id: z.uuid(),
  replacementId: z.uuid('A category must be selected.'),
});

export const setTransactionCategorySchema = z.object({
  transactionIds: z.array(z.uuid()).min(1),
  categoryId: z.uuid().nullable(),
});

export const setMerchantCategorySchema = z.object({
  merchantId: z.uuid(),
  categoryId: z.uuid().nullable(),
  /** A transaction of the merchant whose own category is removed, so it follows the merchant */
  transactionId: z.uuid().optional(),
});

const merchantName = z
  .string()
  .trim()
  .min(1, 'Name is required.')
  .max(100, 'Name must be at most 100 characters.');

export const renameMerchantSchema = z.object({ merchantId: z.uuid(), name: merchantName });

export const mergeMerchantsSchema = z.object({
  merchantIds: z.array(z.uuid()).min(1),
  targetId: z.uuid(),
});

export const moveMerchantAliasSchema = z.object({
  key: z.string().min(1),
  target: z.union([z.object({ merchantId: z.uuid() }), z.object({ name: merchantName })]),
});
