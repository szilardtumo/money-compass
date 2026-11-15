import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';
import { updateSecurityPrices } from '@/server/api/investments/prices';
import { revalueSubaccount } from '@/server/api/investments/valuation';
import { getAdminDb, schema } from '@/server/db';

// A first run fetches the full price history of every security
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const failedPrices = await updateSecurityPrices();

  // Subaccounts that lost their trades are revalued too, which deletes their valuations
  const { admin } = await getAdminDb();
  const subaccounts = await admin
    .selectDistinct({ id: schema.transactions.subaccountId })
    .from(schema.transactions)
    .innerJoin(
      schema.investmentTrades,
      eq(schema.investmentTrades.transactionId, schema.transactions.id),
    )
    .union(
      admin
        .selectDistinct({ id: schema.portfolioValuations.subaccountId })
        .from(schema.portfolioValuations),
    );
  const results = await Promise.allSettled(subaccounts.map(({ id }) => revalueSubaccount(id)));
  const errors = results.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []));
  errors.forEach((error) => console.error('Valuation error:', error));

  revalidatePath('/dashboard', 'layout');

  return Response.json({
    success: !failedPrices && !errors.length,
    failedPrices,
    revalued: results.length - errors.length,
    failed: errors.length,
  });
}
