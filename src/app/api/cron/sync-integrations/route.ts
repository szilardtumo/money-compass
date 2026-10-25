import { isPast } from 'date-fns';
import { isNotNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';
import { syncAccount } from '@/server/api/integrations/sync';
import { getAdminDb, schema } from '@/server/db';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getAdminDb();
  const accounts = await db.admin.query.integrationAccounts.findMany({
    where: isNotNull(schema.integrationAccounts.subaccountId),
    with: { integration: true },
  });

  const results = await Promise.allSettled(
    accounts
      .filter(({ integration }) => !integration.revokedAt && !isPast(integration.expiresAt))
      .map((account) => syncAccount(account, db.admin.transaction.bind(db.admin))),
  );
  const errors = results.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []));
  errors.forEach((error) => console.error('Integration sync error:', error));

  return Response.json({
    success: !errors.length,
    synced: results.length - errors.length,
    failed: errors.length,
  });
}
