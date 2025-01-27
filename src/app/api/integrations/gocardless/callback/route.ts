import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS, revalidateTag } from '@/lib/cache';
import { getUserId } from '@/server/api/queries/profiles.queries';

export async function GET(request: NextRequest) {
  revalidateTag({ tag: CACHE_TAGS.integrations, userId: await getUserId() });

  return NextResponse.redirect(new URL('/dashboard/integrations', request.url));
}
