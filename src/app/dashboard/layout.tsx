import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { GlobalDialogs } from './_components/global-dialogs';
import { Navbar } from './_components/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalDialogs />
      <ResizablePanelGroup direction="horizontal" className="h-full min-h-screen items-stretch">
        <Navbar />
        <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
