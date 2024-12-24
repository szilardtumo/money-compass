import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

import { Database } from '@/lib/types/database.types';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

type BrowserSupabseClient = ReturnType<typeof createBrowserSupabaseClient>;

export function useBrowserSupabaseClient() {
  const [supabase, setSupabase] = useState<BrowserSupabseClient>({} as BrowserSupabseClient);

  useEffect(() => {
    setSupabase(createBrowserSupabaseClient());
  }, []);

  return supabase;
}
