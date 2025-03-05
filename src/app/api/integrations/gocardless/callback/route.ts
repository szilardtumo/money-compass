import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { getUserId } from '@/server/api/queries/profiles.queries';

export async function GET(request: NextRequest) {
  revalidateTag({ tag: CACHE_TAGS.integrations, userId: await getUserId() });

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
