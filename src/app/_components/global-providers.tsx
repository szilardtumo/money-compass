import { ClientCodeProvider } from '@/components/providers/client-code-provider';
import { CreateTransactionDialogProvider } from '@/components/providers/create-transaction-dialog-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { UpsertAccountDialogProvider } from '@/components/providers/upsert-account-dialog-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClientCodeProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <CreateTransactionDialogProvider>
            <UpsertAccountDialogProvider>{children}</UpsertAccountDialogProvider>
          </CreateTransactionDialogProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ClientCodeProvider>
  );
}
