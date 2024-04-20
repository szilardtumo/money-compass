import 'server-only';

import { createClient } from '@supabase/supabase-js';

export function createServerAdminSupabaseClient(
  nextOptions: Pick<RequestInit, 'next' | 'cache'> = {},
) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit | undefined) =>
          fetch(input, { ...init, ...nextOptions }),
      },
    },
  );
}
