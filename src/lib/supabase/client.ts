import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/lib/env';
import { Database } from '@/lib/types/database.types';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
