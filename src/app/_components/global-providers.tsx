import { ThemeProvider } from 'next-themes';

import { LoadingProvider } from '@/components/providers/loading-provider';
import { BrowserSupabaseClientProvider } from '@/components/providers/supabase-client-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <BrowserSupabaseClientProvider>
        <LoadingProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </LoadingProvider>
      </BrowserSupabaseClientProvider>
    </ThemeProvider>
  );
}
