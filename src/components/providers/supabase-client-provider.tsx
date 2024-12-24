'use client';

import { createContext, use, useEffect, useState } from 'react';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type BrowserSupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;

const BrowserSupabaseClientContext = createContext<BrowserSupabaseClient | undefined>(undefined);

export function BrowserSupabaseClientProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<BrowserSupabaseClient>({} as BrowserSupabaseClient);

  useEffect(() => {
    setSupabase(createBrowserSupabaseClient());
  }, []);

  return <BrowserSupabaseClientContext value={supabase}>{children}</BrowserSupabaseClientContext>;
}

// Hook to use the Supabase client
export function useBrowserSupabaseClient() {
  const context = use(BrowserSupabaseClientContext);
  if (context === undefined) {
    throw new Error('useBrowserSupabaseClient must be used within a BrowserSupabaseClientProvider');
  }
  return context;
}
