import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { jwtDecode } from 'jwt-decode';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';

import { env } from '@/lib/env';
import { Database } from '@/lib/types/database.types';

/**
 * Creates a Supabase client that can write cookies.
 *
 * This method should only be used in environments that allow reading and writing cookie headers
 *
 * @returns The Supabase client
 */
export async function createWritableServerSupabaseClient(
  nextOptions: Pick<RequestInit, 'next' | 'cache'> = {},
) {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit | undefined) =>
          fetch(input, { ...init, ...nextOptions }),
      },
    },
  );
}

/**
 * Creates a Supabase client with the cookies provided as parameters.
 *
 * @param plainCookies An array of plain cookies to be used by the Supabase client
 * @returns The Supabase client
 */
export async function createServerSupabaseClient(plainCookies: RequestCookie[]) {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return plainCookies;
        },
        setAll() {
          throw new Error('Cannot set cookies with this supabase client!');
        },
      },
    },
  );
}

export type SupabaseToken = {
  iss?: string;
  sub?: string;
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  role?: string;
};

/**
 * Retrieves the Supabase token from the session.
 *
 * This function attempts to fetch the Supabase token from the current session.
 * If the token is found, it is decoded and returned. If not, a default token with
 * the role set to 'anon' is returned.
 *
 * @returns A promise that resolves to the Supabase token.
 */
export async function getSupabaseToken(): Promise<SupabaseToken> {
  const supabase = await createWritableServerSupabaseClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  return token ? jwtDecode<SupabaseToken>(token) : { role: 'anon' };
}
