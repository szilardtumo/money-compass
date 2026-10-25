import { NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE, CALLBACK_PATH, saveSession } from '@/server/api/integrations/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const redirectUrl = new URL('/dashboard/integrations', request.url);

  try {
    const { state, integrationId } = JSON.parse(
      request.cookies.get(AUTH_COOKIE)?.value ?? '{}',
    ) as { state?: string; integrationId?: string };
    const code = searchParams.get('code');

    if (searchParams.has('error')) {
      throw new Error(searchParams.get('error_description') || searchParams.get('error')!);
    }
    if (!code || !state || state !== searchParams.get('state')) {
      throw new Error('The bank authorization expired. Please try again.');
    }

    await saveSession(code, integrationId);
  } catch (error) {
    console.error('Integration callback error:', error);
    redirectUrl.searchParams.set(
      'error',
      error instanceof Error ? error.message : 'Failed to connect the bank.',
    );
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete({ name: AUTH_COOKIE, path: CALLBACK_PATH });
  return response;
}
