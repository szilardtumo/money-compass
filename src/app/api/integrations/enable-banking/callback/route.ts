import { NextRequest, NextResponse } from 'next/server';

import { UserError } from '@/lib/api/errors';
import { AUTH_COOKIE, CALLBACK_PATH, saveSession } from '@/server/api/integrations/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const redirectUrl = new URL('/dashboard/integrations', request.url);

  try {
    const { state, ...auth } = JSON.parse(request.cookies.get(AUTH_COOKIE)?.value ?? '{}') as {
      state?: string;
      integrationId?: string;
      logoUrl?: string;
    };
    const code = searchParams.get('code');

    if (searchParams.has('error')) {
      throw new UserError(searchParams.get('error_description') || searchParams.get('error')!);
    }
    if (!code || !state || state !== searchParams.get('state')) {
      throw new UserError('The bank authorization expired. Please try again.');
    }

    await saveSession(code, auth);
  } catch (error) {
    console.error('Integration callback error:', error);
    redirectUrl.searchParams.set(
      'error',
      error instanceof UserError ? error.message : 'Something went wrong. Please try again.',
    );
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete({ name: AUTH_COOKIE, path: CALLBACK_PATH });
  return response;
}
