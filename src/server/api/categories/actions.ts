'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { returnValidationErrors } from 'next-safe-action';

import { authenticatedActionClient } from '@/lib/api';
import { deleteCategorySchema, saveCategorySchema } from '@/lib/validation/categories';
import { schema } from '@/server/db';
import { isUniqueConstraintError } from '@/server/db/errors';

// New categories take the first color no other category uses
const COLORS = [
  '#06b6d4',
  '#10b981',
  '#f472b6',
  '#fb923c',
  '#a3e635',
  '#818cf8',
  '#facc15',
  '#2dd4bf',
];

const c = schema.categories;

/**
 * Creates a category, or updates the one with the given ID.
 */
export const saveCategory = authenticatedActionClient
  .inputSchema(saveCategorySchema)
  .action(async ({ parsedInput: { id, name, kind }, ctx }) => {
    await ctx.db
      .rls(async (tx) => {
        if (id) {
          await tx.update(c).set({ name, kind }).where(eq(c.id, id));
          return;
        }

        const used = new Set(
          (await tx.select({ color: c.color }).from(c)).map((item) => item.color),
        );
        const color = COLORS.find((item) => !used.has(item)) ?? COLORS[used.size % COLORS.length];
        await tx.insert(c).values({ name, kind, color });
      })
      .catch((error) => {
        if (isUniqueConstraintError(error)) {
          returnValidationErrors(saveCategorySchema, {
            name: { _errors: ['A category with this name already exists.'] },
          });
        }
        throw error;
      });

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Deletes a category and moves its merchants and transactions to another category.
 */
export const deleteCategory = authenticatedActionClient
  .inputSchema(deleteCategorySchema)
  .action(async ({ parsedInput: { id, replacementId }, ctx }) => {
    if (id === replacementId) {
      returnValidationErrors(deleteCategorySchema, {
        replacementId: { _errors: ['Choose another category.'] },
      });
    }

    await ctx.db.rls(async (tx) => {
      await tx
        .update(schema.merchants)
        .set({ categoryId: replacementId })
        .where(eq(schema.merchants.categoryId, id));
      await tx
        .update(schema.transactions)
        .set({ categoryId: replacementId })
        .where(eq(schema.transactions.categoryId, id));
      await tx.delete(c).where(eq(c.id, id));
    });

    revalidatePath('/dashboard', 'layout');
  });
