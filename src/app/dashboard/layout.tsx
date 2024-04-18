import { redirect } from 'next/navigation';

import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { createServerSupabaseClient } from '@/lib/utils/supabase/server';

import { GlobalDialogs } from './_components/global-dialogs';
import { Navbar } from './_components/navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <>
      <GlobalDialogs />
      <ResizablePanelGroup direction="horizontal" className="h-full min-h-screen items-stretch">
        <Navbar user={user} />
        <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
