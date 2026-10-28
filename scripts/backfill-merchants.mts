/* eslint-disable no-console */
// One-off: writes the merchant keys of the transactions saved before merchants existed, creates
// their merchants, and runs the LLM pass until every card merchant was checked. Without
// ANTHROPIC_API_KEY it only creates the merchants.
// Run: NODE_OPTIONS=--conditions=react-server yarn dlx tsx scripts/backfill-merchants.mts <local|prod>
const target = process.argv[2];
if (target !== 'local' && target !== 'prod') {
  throw new Error('Usage: scripts/backfill-merchants.mts <local|prod>');
}

process.loadEnvFile(target === 'prod' ? '.env.prod.local' : '.env.local');

const { inArray, isNull } = await import('drizzle-orm');
const { getMerchantKey } = await import('@/lib/utils/merchants');
const { getAdminDb, schema } = await import('@/server/db');
const { assignMerchants, enrichMerchants } = await import('@/server/api/merchants/categorize');

const db = (await getAdminDb()).admin;
const t = schema.transactions;

const rows = await db
  .select({
    id: t.id,
    userId: t.userId,
    type: t.type,
    counterpartyName: t.counterpartyName,
    description: t.description,
  })
  .from(t)
  .where(isNull(t.merchantKey));

const idsByKey = new Map<string, string[]>();
for (const row of rows) {
  const key = getMerchantKey(row);
  if (key) {
    idsByKey.set(key, [...(idsByKey.get(key) ?? []), row.id]);
  }
}

const userIds = [...new Set(rows.map((row) => row.userId))];
await db.transaction(async (tx) => {
  for (const [key, ids] of idsByKey) {
    await tx.update(t).set({ merchantKey: key }).where(inArray(t.id, ids));
  }
  for (const userId of userIds) {
    await assignMerchants(tx, userId);
  }
});
console.log(
  `Keys written for ${rows.length} transactions (${idsByKey.size} keys), users: ${userIds.length}`,
);

const transaction = db.transaction.bind(db);

for (const userId of userIds) {
  let total = 0;
  // Stops when none are left, or when every batch failed (the log above has the errors)
  for (let checked; (checked = await enrichMerchants(transaction, userId));) {
    total += checked;
    console.log(`User ${userId}: ${total} merchants checked`);
  }
}

process.exit(0);
