import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/lib/env';

/**
 * Creates a Supabase client that can write cookies.
 *
 * This method should only be used in environments that allow reading and writing cookie headers
 *
 * @returns The Supabase client
 */
export async function createWritableServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
    },
  );
}

export type SupabaseClaims = {
  sub: string;
  role: string;
  email?: string;
  user_metadata: { full_name?: string };
};

/**
 * Verifies the session's access token and returns the claims the API needs.
 *
 * @returns The verified claims, or null if the request has no valid session.
 */
export async function getSupabaseClaims(): Promise<SupabaseClaims | null> {
  const supabase = await createWritableServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) {
    return null;
  }

  const { sub, role, email, user_metadata } = data.claims;
  return { sub, role, email, user_metadata: { full_name: user_metadata?.full_name } };
}
