import { ClientCodeProvider } from '@/components/providers/client-code-provider';
import { CreateTransactionDialogProvider } from '@/components/providers/create-transaction-dialog-provider';
import { LoadingProvider } from '@/components/providers/loading-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { UpdateTransactionDialogProvider } from '@/components/providers/update-transaction-dialog-provider';
import { UpsertAccountDialogProvider } from '@/components/providers/upsert-account-dialog-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClientCodeProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <LoadingProvider>
          <TooltipProvider>
            <CreateTransactionDialogProvider>
              <UpdateTransactionDialogProvider>
                <UpsertAccountDialogProvider>{children}</UpsertAccountDialogProvider>
              </UpdateTransactionDialogProvider>
            </CreateTransactionDialogProvider>
          </TooltipProvider>
        </LoadingProvider>
      </ThemeProvider>
    </ClientCodeProvider>
  );
}
