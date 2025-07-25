import { redirect } from 'next/navigation';

import { DialogsProvider } from '@/components/dialogs/dialogs-provider';
import { PageHeaderSlot, PageHeaderSlotProvider } from '@/components/ui/page-header-slot';
import { PageContent, PageHeader, PageLayout } from '@/components/ui/page-layout';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AuthenticationError } from '@/lib/api/errors';
import { apiQueries } from '@/server/api/queries';

import { Navbar } from './_components/navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await apiQueries.profiles.getProfile();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/auth/login');
    }
    throw error;
  }

  return (
    <DialogsProvider>
      <ResizablePanelGroup direction="horizontal" className="h-full min-h-screen items-stretch">
        <Navbar />
        <ResizablePanel id="main-panel" defaultSize={80}>
          <PageLayout>
            <PageHeaderSlotProvider>
              <PageHeader>
                <PageHeaderSlot />
              </PageHeader>

              <PageContent>{children}</PageContent>
            </PageHeaderSlotProvider>
          </PageLayout>
        </ResizablePanel>
      </ResizablePanelGroup>
    </DialogsProvider>
  );
}
