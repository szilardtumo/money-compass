import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { and, asc, eq, exists, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { env } from '@/lib/env';
import { getMerchantName } from '@/lib/utils/merchants';
import { DbClient, DbTx, schema } from '@/server/db';

// Bank card types. Their names are businesses, while transfers name people, which never go to the LLM.
const CARD_TYPES = ['card_payment', 'refund', 'atm', 'fee', 'reward'];
const BATCH_SIZE = 100;

/**
 * Serializes the merchant writes of a user, because the syncs of several accounts can bring the
 * same new merchant at the same time.
 */
export async function lockMerchants(tx: DbTx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

/**
 * Moves the aliases, and with them the transactions, of a merchant to another one and deletes it.
 * The target keeps its category, or takes the source's if it has none.
 */
export async function mergeMerchant(
  tx: DbTx,
  source: { id: string; categoryId: string | null },
  target: { id: string; categoryId: string | null },
) {
  await tx
    .update(schema.merchantAliases)
    .set({ merchantId: target.id })
    .where(eq(schema.merchantAliases.merchantId, source.id));
  if (!target.categoryId && source.categoryId) {
    await tx
      .update(schema.merchants)
      .set({ categoryId: source.categoryId })
      .where(eq(schema.merchants.id, target.id));
  }
  await tx.delete(schema.merchants).where(eq(schema.merchants.id, source.id));
}

/**
 * Creates a merchant for every merchant key of the user's transactions that has none yet, named
 * after the first transaction with that key, and without a category. Card merchants then wait for
 * enrichMerchants. Sets the user explicitly, because the cron job has no user session.
 */
export async function assignMerchants(tx: DbTx, userId: string) {
  await lockMerchants(tx, userId);

  const t = schema.transactions;
  const newKeys = await tx
    .selectDistinctOn([t.merchantKey], {
      key: t.merchantKey,
      type: t.type,
      counterpartyName: t.counterpartyName,
      description: t.description,
    })
    .from(t)
    .leftJoin(
      schema.merchantAliases,
      and(
        eq(schema.merchantAliases.userId, t.userId),
        eq(schema.merchantAliases.key, t.merchantKey),
      ),
    )
    .where(and(eq(t.userId, userId), isNotNull(t.merchantKey), isNull(schema.merchantAliases.key)))
    .orderBy(t.merchantKey, asc(t.startedDate));
  if (!newKeys.length) {
    return;
  }

  const now = new Date();
  const values = newKeys.map((item) => ({
    key: item.key!,
    name: getMerchantName(item) ?? item.key!,
    autoCheckedAt: CARD_TYPES.includes(item.type) ? null : now,
  }));
  // A merchant with the same name already exists when the LLM renamed another one to it
  const merchants = await tx
    .insert(schema.merchants)
    .values(values.map(({ name, autoCheckedAt }) => ({ userId, name, autoCheckedAt })))
    .onConflictDoUpdate({
      target: [schema.merchants.userId, schema.merchants.name],
      set: { name: sql`excluded.name` },
    })
    .returning({ id: schema.merchants.id, name: schema.merchants.name });
  const idsByName = new Map(merchants.map((merchant) => [merchant.name, merchant.id]));

  await tx
    .insert(schema.merchantAliases)
    .values(values.map(({ key, name }) => ({ userId, key, merchantId: idsByName.get(name)! })))
    .onConflictDoNothing();
}

const SYSTEM_PROMPT = `You clean up merchant names from bank card statements and categorize the merchants.

For each merchant, return:
- name: the merchant's common brand name, without store numbers, cities, legal forms (Srl, Kft, Ltd) or payment processor prefixes (Payu*, Sumup*). Branches of one chain get the same name. If the merchant is one of the existing merchants, return that name exactly. Keep the original name, cleaned up, if you don't recognize the brand.
- category: one of the given categories, or null if you can't tell what the business sells from its name. Don't guess.`;

/**
 * Asks the LLM for a clean name and a category for the user's new card merchants. A merchant whose
 * new name matches another merchant is merged into it, which groups the branches of a chain.
 * Does nothing without ANTHROPIC_API_KEY, and never throws: failed batches are retried on the
 * next run.
 *
 * @param transaction Runs the database writes, with RLS for a user or without it for the cron job.
 */
export async function enrichMerchants(transaction: DbClient['rls'], userId: string) {
  if (!env.ANTHROPIC_API_KEY) {
    return;
  }

  try {
    const m = schema.merchants;
    const { pending, existingNames, categories } = await transaction(async (tx) => {
      const [pending, existing, categories] = await Promise.all([
        tx
          .select({ id: m.id, name: m.name })
          .from(m)
          .where(and(eq(m.userId, userId), isNull(m.autoCheckedAt)))
          .orderBy(m.name)
          // Keeps a run within the function time limit. The rest waits for the next sync.
          .limit(300),
        tx
          .select({ name: m.name })
          .from(m)
          .where(
            and(
              eq(m.userId, userId),
              isNotNull(m.autoCheckedAt),
              exists(
                tx
                  .select({ key: schema.merchantAliases.key })
                  .from(schema.merchantAliases)
                  .innerJoin(
                    schema.transactions,
                    and(
                      eq(schema.transactions.userId, schema.merchantAliases.userId),
                      eq(schema.transactions.merchantKey, schema.merchantAliases.key),
                    ),
                  )
                  .where(
                    and(
                      eq(schema.merchantAliases.merchantId, m.id),
                      inArray(schema.transactions.type, CARD_TYPES),
                    ),
                  ),
              ),
            ),
          ),
        tx
          .select({ id: schema.categories.id, name: schema.categories.name })
          .from(schema.categories)
          .where(eq(schema.categories.userId, userId)),
      ]);
      return { pending, existingNames: existing.map((item) => item.name), categories };
    });
    if (!pending.length || !categories.length) {
      return;
    }

    const categoryNames = categories.map((category) => category.name) as [string, ...string[]];
    const outputFormat = zodOutputFormat(
      z.object({
        merchants: z.array(
          z.object({
            index: z.number(),
            name: z.string(),
            category: z.enum(categoryNames).nullable(),
          }),
        ),
      }),
    );
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    for (let start = 0; start < pending.length; start += BATCH_SIZE) {
      const batch = pending.slice(start, start + BATCH_SIZE);

      try {
        const response = await client.messages.parse({
          model: 'claude-haiku-5-5',
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: JSON.stringify({
                categories: categoryNames,
                existingMerchants: existingNames,
                merchants: batch.map((merchant, index) => ({ index, name: merchant.name })),
              }),
            },
          ],
          output_config: { effort: 'low', format: outputFormat },
        });
        if (!response.parsed_output) {
          throw new Error(`No parsed output, stop reason ${response.stop_reason}`);
        }

        const results = response.parsed_output.merchants;
        await transaction(async (tx) => {
          await lockMerchants(tx, userId);
          // Read again under the lock: the user or another run may have changed them meanwhile
          const current = await tx
            .select({
              id: m.id,
              name: m.name,
              categoryId: m.categoryId,
              autoCheckedAt: m.autoCheckedAt,
            })
            .from(m)
            .where(eq(m.userId, userId));
          const byId = new Map(current.map((merchant) => [merchant.id, merchant]));
          const byName = new Map(
            current.map((merchant) => [merchant.name.toLowerCase(), merchant]),
          );

          for (const result of results) {
            const merchant = byId.get(batch[result.index]?.id ?? '');
            const name = result.name.trim();
            if (!merchant || merchant.autoCheckedAt || !name) {
              continue;
            }

            const categoryId =
              merchant.categoryId ??
              categories.find((category) => category.name === result.category)?.id ??
              null;
            const target = byName.get(name.toLowerCase());

            if (target && target.id !== merchant.id) {
              await mergeMerchant(tx, { id: merchant.id, categoryId }, target);
              target.categoryId ??= categoryId;
              byName.delete(merchant.name.toLowerCase());
              continue;
            }

            await tx
              .update(m)
              .set({ name, categoryId, autoCheckedAt: new Date() })
              .where(eq(m.id, merchant.id));
            byName.delete(merchant.name.toLowerCase());
            byName.set(name.toLowerCase(), { ...merchant, name, categoryId });
          }

          // Merchants the answer left out aren't asked again
          await tx
            .update(m)
            .set({ autoCheckedAt: new Date() })
            .where(
              and(
                inArray(
                  m.id,
                  batch.map((merchant) => merchant.id),
                ),
                isNull(m.autoCheckedAt),
              ),
            );
        });
        existingNames.push(...results.map((result) => result.name));
      } catch (error) {
        console.error('Merchant categorization batch failed:', error);
      }
    }
  } catch (error) {
    console.error('Merchant categorization failed:', error);
  }
}
