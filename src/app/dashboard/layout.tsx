import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { apiQueries } from '@/server/api/queries';

import { GlobalDialogs } from './_components/global-dialogs';
import { Navbar } from './_components/navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, currencies] = await Promise.all([
    apiQueries.profiles.getProfile(),
    apiQueries.currencies.getCurrencies(),
  ]);

  return (
    <>
      <GlobalDialogs />
      <ResizablePanelGroup direction="horizontal" className="h-full min-h-screen items-stretch">
        <Navbar profile={profile} currencies={currencies} />
        <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
