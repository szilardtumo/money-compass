import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';
import { adminSyncAllIntegrations } from '@/server/api/integrations/sync-integration-links';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await adminSyncAllIntegrations();
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to sync integrations:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to sync integrations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
