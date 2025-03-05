import type { NextRequest } from 'next/server';

import { apiActions } from '@/server/api/actions';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET!}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await apiActions.integrationLinks.adminSyncAllIntegrations();
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to sync integrations:', error);
    return Response.json({ success: false, error: 'Failed to sync integrations' }, { status: 500 });
  }
}
