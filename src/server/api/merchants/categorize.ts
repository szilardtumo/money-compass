import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { and, asc, desc, eq, exists, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

import { env } from '@/lib/env';
import { getMerchantName, normalizeMerchantName } from '@/lib/utils/merchants';
import { DbClient, DbTx, schema } from '@/server/db';

// Bank card types. Their names are businesses, while transfers name people, which never go to the
// LLM. Neither do the descriptions the user typed for manual transactions.
const isCardTransaction = and(
  inArray(schema.transactions.type, ['card_payment', 'refund', 'atm', 'fee', 'reward']),
  eq(schema.transactions.dataSource, 'integration'),
)!;
const BATCH_SIZE = 100;

/**
 * Serializes the merchant writes of a user, because the syncs of several accounts can bring the
 * same new merchant at the same time.
 */
export async function lockMerchants(tx: DbTx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

/**
 * Moves the transactions of a merchant to another one and deletes it. The target keeps its
 * category, or takes the source's if it has none.
 */
export async function mergeMerchant(
  tx: DbTx,
  source: { id: string; categoryId: string | null },
  target: { id: string; categoryId: string | null },
) {
  await tx
    .update(schema.transactions)
    .set({ merchantId: target.id })
    .where(eq(schema.transactions.merchantId, source.id));
  if (!target.categoryId && source.categoryId) {
    await tx
      .update(schema.merchants)
      .set({ categoryId: source.categoryId })
      .where(eq(schema.merchants.id, target.id));
  }
  await tx.delete(schema.merchants).where(eq(schema.merchants.id, source.id));
}

/**
 * Returns the user's merchant with this name, compared like the unique index compares names.
 */
export async function findMerchantByName(tx: DbTx, userId: string, name: string) {
  const [merchant] = await tx
    .select({
      id: schema.merchants.id,
      name: schema.merchants.name,
      categoryId: schema.merchants.categoryId,
    })
    .from(schema.merchants)
    .where(
      and(
        eq(schema.merchants.userId, userId),
        sql`lower(${schema.merchants.name}) = lower(${name})`,
      ),
    );
  return merchant;
}

/**
 * Gives the user's transactions without a merchant the merchant of the other transactions with the
 * same key. New keys get a new merchant, named after their first card transaction (else their first
 * transaction) and without a category, and card merchants then wait for enrichMerchants. Sets the
 * user explicitly, because the cron job has no user session.
 */
export async function assignMerchants(tx: DbTx, userId: string) {
  await lockMerchants(tx, userId);

  const t = schema.transactions;
  const other = alias(t, 'other');
  await tx
    .update(t)
    .set({ merchantId: other.merchantId })
    .from(other)
    .where(
      and(
        eq(t.userId, userId),
        isNull(t.merchantId),
        eq(other.userId, userId),
        eq(other.merchantKey, t.merchantKey),
        isNotNull(other.merchantId),
      ),
    );

  const newKeys = await tx
    .selectDistinctOn([t.merchantKey], {
      key: t.merchantKey,
      type: t.type,
      counterpartyName: t.counterpartyName,
      description: t.description,
    })
    .from(t)
    .where(and(eq(t.userId, userId), isNotNull(t.merchantKey), isNull(t.merchantId)))
    // The first card transaction of a key, else its first transaction
    .orderBy(t.merchantKey, desc(isCardTransaction), asc(t.startedDate));
  if (!newKeys.length) {
    return;
  }

  const values = newKeys.map((item) => ({
    key: item.key!,
    name: getMerchantName(item) ?? item.key!,
  }));
  // A merchant with the same name, in any case, exists when the LLM renamed another one to it
  await tx
    .insert(schema.merchants)
    .values(values.map(({ name }) => ({ userId, name })))
    .onConflictDoNothing();
  // Matched in SQL, so the names compare like the unique index does
  await tx.execute(sql`
    update ${t} set merchant_id = ${schema.merchants.id}
    from (values ${sql.join(
      values.map(({ key, name }) => sql`(${key}, ${name})`),
      sql`, `,
    )}) as new_key (key, name)
    join ${schema.merchants} on ${schema.merchants.userId} = ${userId}
      and lower(${schema.merchants.name}) = lower(new_key.name)
    where ${t.userId} = ${userId} and ${t.merchantId} is null and ${t.merchantKey} = new_key.key`);
}

const SYSTEM_PROMPT = `You clean up merchant names from bank card statements and categorize the merchants.

For each merchant, return:
- input: the merchant's name exactly as given.
- name: the merchant's common brand name, without store numbers, cities or legal forms (Srl, Kft, Ltd). Branches of one chain get the same name. If the merchant is one of the existing merchants, return that name exactly. Keep the original name, cleaned up, if you don't recognize the brand.
  - A payment processor (PayPal, Payu, Sumup, Zettle, Stripe) is not the merchant: "Paypal *Kinguin" is Kinguin. Use the processor's name only when no seller follows it.
  - Keep the word that says what the business is when a place comes first: "Westend Gyógyszertár" is a pharmacy in the Westend mall, not the mall. A city or a street alone is never a name.
- category: one of the given categories, or null if you can't tell what the business sells. Use what you know about local chains in the countries of the account currencies. Don't guess.`;

/**
 * Asks the LLM for a clean name and a category for the user's unchecked merchants that have bank
 * card transactions. A merchant whose new name matches another merchant is merged into it, which
 * groups the branches of a chain. Does nothing without ANTHROPIC_API_KEY, and never throws: failed
 * batches are retried on the next run.
 *
 * @param transaction Runs the database writes, with RLS for a user or without it for the cron job.
 * @returns The number of merchants it checked, 0 when none are left or every batch failed.
 */
export async function enrichMerchants(transaction: DbClient['rls'], userId: string) {
  if (!env.ANTHROPIC_API_KEY) {
    return 0;
  }

  let checked = 0;
  try {
    const m = schema.merchants;
    const [pending, existing, categories, currencies] = await transaction((tx) => {
      const hasCardTransaction = exists(
        tx
          .select({ id: schema.transactions.id })
          .from(schema.transactions)
          .where(and(eq(schema.transactions.merchantId, m.id), isCardTransaction)),
      );

      return Promise.all([
        tx
          .select({ id: m.id, name: m.name })
          .from(m)
          .where(and(eq(m.userId, userId), isNull(m.autoCheckedAt), hasCardTransaction))
          .orderBy(m.name)
          // Keeps a run within the function time limit. The rest waits for the next sync.
          .limit(300),
        tx
          .select({ name: m.name })
          .from(m)
          .where(and(eq(m.userId, userId), isNotNull(m.autoCheckedAt), hasCardTransaction)),
        tx
          .select({ id: schema.categories.id, name: schema.categories.name })
          .from(schema.categories)
          .where(eq(schema.categories.userId, userId)),
        tx
          .selectDistinct({ currency: schema.subaccounts.currency })
          .from(schema.subaccounts)
          .innerJoin(schema.accounts, eq(schema.accounts.id, schema.subaccounts.accountId))
          .where(eq(schema.accounts.userId, userId)),
      ]);
    });
    if (!pending.length || !categories.length) {
      return 0;
    }
    const existingNames = existing.map((item) => item.name);

    const categoryNames = categories.map((category) => category.name) as [string, ...string[]];
    const outputFormat = zodOutputFormat(
      z.object({
        merchants: z.array(
          z.object({
            input: z.string(),
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
                accountCurrencies: currencies.map((item) => item.currency.toUpperCase()),
                existingMerchants: existingNames,
                merchants: batch.map((merchant) => merchant.name),
              }),
            },
          ],
          output_config: { effort: 'low', format: outputFormat },
        });
        if (!response.parsed_output) {
          throw new Error(`No parsed output, stop reason ${response.stop_reason}`);
        }

        const results = response.parsed_output.merchants;
        // Answers are matched by the name they echo, which is unique in a batch like the keys
        const requested = new Map(
          batch.map((merchant) => [normalizeMerchantName(merchant.name), merchant]),
        );

        await transaction(async (tx) => {
          await lockMerchants(tx, userId);

          for (const result of results) {
            const merchantId = requested.get(normalizeMerchantName(result.input))?.id;
            const name = result.name.trim();
            if (!merchantId || !name) {
              continue;
            }

            // Read under the lock: the user, another run or an earlier answer may have handled it
            const [merchant] = await tx
              .select({ id: m.id, categoryId: m.categoryId })
              .from(m)
              .where(and(eq(m.id, merchantId), isNull(m.autoCheckedAt)));
            if (!merchant) {
              continue;
            }

            const categoryId =
              merchant.categoryId ??
              categories.find((category) => category.name === result.category)?.id ??
              null;
            const target = await findMerchantByName(tx, userId, name);

            if (target && target.id !== merchant.id) {
              await mergeMerchant(tx, { id: merchant.id, categoryId }, target);
            } else {
              await tx
                .update(m)
                .set({ name, categoryId, autoCheckedAt: new Date() })
                .where(eq(m.id, merchant.id));
            }
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
        checked += batch.length;
      } catch (error) {
        console.error('Merchant categorization batch failed:', error);
      }
    }
  } catch (error) {
    console.error('Merchant categorization failed:', error);
  }
  return checked;
}
