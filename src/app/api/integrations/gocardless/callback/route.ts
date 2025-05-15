import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS, revalidateTag } from '@/lib/api/cache';
import { apiQueries } from '@/server/api/queries';

export async function GET(request: NextRequest) {
  revalidateTag({ tag: CACHE_TAGS.integrations, userId: await apiQueries.profiles.getUserId() });

  const redirectUrl = new URL('/dashboard/integrations', request.url);

  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  const details = searchParams.get('details');
  if (error) {
    console.error(`GoCardless callback error: ${error}`);
    const errorMessage = details || 'Failed to link integration. Please try again.';
    redirectUrl.searchParams.set('error', errorMessage);
  }

  return NextResponse.redirect(redirectUrl);
}
