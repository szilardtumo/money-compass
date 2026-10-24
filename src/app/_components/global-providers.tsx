import { ThemeProvider } from 'next-themes';

import { BrowserSupabaseClientProvider } from '@/components/providers/supabase-client-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <BrowserSupabaseClientProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </BrowserSupabaseClientProvider>
    </ThemeProvider>
  );
}
