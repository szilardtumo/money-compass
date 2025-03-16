import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

export function createServerAdminSupabaseClient(
  nextOptions: Pick<RequestInit, 'next' | 'cache'> = {},
) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit | undefined) =>
        fetch(input, { ...init, ...nextOptions }),
    },
  });
}
