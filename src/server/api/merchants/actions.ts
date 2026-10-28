'use server';

import { and, count, eq, inArray, ne, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { authenticatedActionClient } from '@/lib/api';
import { NotFoundError } from '@/lib/api/errors';
import {
  mergeMerchantsSchema,
  moveMerchantAliasSchema,
  renameMerchantSchema,
  setMerchantCategorySchema,
} from '@/lib/validation/categories';
import { DbTx, schema } from '@/server/db';

import { lockMerchants, mergeMerchant } from './categorize';

const m = schema.merchants;

async function getMerchant(tx: DbTx, merchantId: string) {
  const [merchant] = await tx
    .select({ id: m.id, name: m.name, categoryId: m.categoryId })
    .from(m)
    .where(eq(m.id, merchantId));
  if (!merchant) {
    throw new NotFoundError('merchant', merchantId);
  }
  return merchant;
}

// Names are unique per user. Two names that differ only in case belong to the same merchant.
async function findMerchantByName(tx: DbTx, name: string) {
  const [merchant] = await tx
    .select({ id: m.id, name: m.name, categoryId: m.categoryId })
    .from(m)
    .where(sql`lower(${m.name}) = lower(${name})`);
  return merchant;
}

/**
 * Sets the category of merchants, for all their past and future transactions except the ones with
 * their own category.
 */
export const setMerchantCategory = authenticatedActionClient
  .inputSchema(setMerchantCategorySchema)
  .action(async ({ parsedInput: { merchantIds, categoryId, transactionId }, ctx }) => {
    await ctx.db.rls(async (tx) => {
      await tx
        .update(m)
        .set({ categoryId, autoCheckedAt: new Date() })
        .where(inArray(m.id, merchantIds));

      if (transactionId) {
        await tx
          .update(schema.transactions)
          .set({ categoryId: null })
          .where(eq(schema.transactions.id, transactionId));
      }
    });

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Renames a merchant. Renaming it to the name of another merchant merges it into that one.
 *
 * @returns The name of the merchant it was merged into, if any.
 */
export const renameMerchant = authenticatedActionClient
  .inputSchema(renameMerchantSchema)
  .action(async ({ parsedInput: { merchantId, name }, ctx }) => {
    const mergedInto = await ctx.db.rls(async (tx) => {
      await lockMerchants(tx, ctx.userId);
      const merchant = await getMerchant(tx, merchantId);
      const other = await findMerchantByName(tx, name);

      if (other && other.id !== merchant.id) {
        await mergeMerchant(tx, merchant, other);
        // The user chose it, so the LLM leaves it alone
        await tx.update(m).set({ autoCheckedAt: new Date() }).where(eq(m.id, other.id));
        return other.name;
      }

      await tx.update(m).set({ name, autoCheckedAt: new Date() }).where(eq(m.id, merchantId));
      return null;
    });

    revalidatePath('/dashboard', 'layout');
    return { mergedInto };
  });

/**
 * Merges merchants into one of them, which keeps its name and category.
 */
export const mergeMerchants = authenticatedActionClient
  .inputSchema(mergeMerchantsSchema)
  .action(async ({ parsedInput: { merchantIds, targetId }, ctx }) => {
    await ctx.db.rls(async (tx) => {
      await lockMerchants(tx, ctx.userId);
      const target = await getMerchant(tx, targetId);
      const sources = await tx
        .select({ id: m.id, categoryId: m.categoryId })
        .from(m)
        .where(and(inArray(m.id, merchantIds), ne(m.id, targetId)));

      for (const source of sources) {
        await mergeMerchant(tx, source, target);
        target.categoryId ??= source.categoryId;
      }
      await tx.update(m).set({ autoCheckedAt: new Date() }).where(eq(m.id, targetId));
    });

    revalidatePath('/dashboard', 'layout');
  });

/**
 * Moves one raw name of a merchant, with its transactions, to another merchant, or to a new one
 * with the given name and the category of the merchant it leaves. A merchant left without names is
 * deleted.
 */
export const moveMerchantAlias = authenticatedActionClient
  .inputSchema(moveMerchantAliasSchema)
  .action(async ({ parsedInput: { key, target }, ctx }) => {
    await ctx.db.rls(async (tx) => {
      await lockMerchants(tx, ctx.userId);
      const [alias] = await tx
        .select({ merchantId: schema.merchantAliases.merchantId })
        .from(schema.merchantAliases)
        .where(eq(schema.merchantAliases.key, key));
      if (!alias) {
        throw new NotFoundError('merchant name', key);
      }

      const source = await getMerchant(tx, alias.merchantId);
      const destination =
        'merchantId' in target
          ? await getMerchant(tx, target.merchantId)
          : ((await findMerchantByName(tx, target.name)) ??
            (
              await tx
                .insert(m)
                .values({
                  userId: ctx.userId,
                  name: target.name,
                  categoryId: source.categoryId,
                  autoCheckedAt: new Date(),
                })
                .returning({ id: m.id })
            )[0]);
      if (destination.id === source.id) {
        return;
      }

      await tx
        .update(schema.merchantAliases)
        .set({ merchantId: destination.id })
        .where(eq(schema.merchantAliases.key, key));

      const [{ value: aliasesLeft }] = await tx
        .select({ value: count() })
        .from(schema.merchantAliases)
        .where(eq(schema.merchantAliases.merchantId, source.id));
      if (!aliasesLeft) {
        await tx.delete(m).where(eq(m.id, source.id));
      }
    });

    revalidatePath('/dashboard', 'layout');
  });
