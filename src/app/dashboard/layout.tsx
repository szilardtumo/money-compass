import { PageHeaderSlot, PageHeaderSlotProvider } from '@/components/ui/page-header-slot';
import { PageContent, PageHeader, PageLayout } from '@/components/ui/page-layout';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { Navbar } from './_components/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}
