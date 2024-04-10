import {
  CounterClockwiseClockIcon,
  CubeIcon,
  HamburgerMenuIcon,
  MixIcon,
} from '@radix-ui/react-icons';
import { User } from '@supabase/supabase-js';

import { AccountIcon } from '@/components/ui/account-avatar';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';

import { AccountDropdown } from './account-dropdown';
import { NavItem } from './nav-item';

async function NavbarContent({ user }: NavbarProps) {
  const accounts = await getSimpleAccounts();

  return (
    <aside className="w-full">
      <div className="flex h-14 items-center justify-center px-2">
        <AccountDropdown user={user} />
      </div>
      <Separator />
      <nav className="flex flex-col gap-1 p-2">
        <NavItem href="/dashboard">
          <CubeIcon className="mr-2" /> Dashboard
        </NavItem>
        <NavItem href="/dashboard/transactions">
          <CounterClockwiseClockIcon className="mr-2" /> Transactions
        </NavItem>

        <Separator className="my-2" />

        <section className="pl-4 flex flex-col gap-1">
          <h2 className="text-md font-semibold tracking-tight">Accounts</h2>
          {accounts.map((account) => (
            <NavItem key={account.id} href={`/dashboard/accounts/${account.id}`}>
              <AccountIcon category={account.category} className="w-4 h-4 mr-2" />
              {account.name}
            </NavItem>
          ))}
        </section>

        <Separator className="my-2" />

        <NavItem href="/dashboard/test">
          <MixIcon className="mr-2" /> Test
        </NavItem>
      </nav>
    </aside>
  );
}

interface NavbarProps {
  user: User;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <>
      {/* Mobile */}
      <div className="absolute sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="m-[10px]">
              <HamburgerMenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <NavbarContent user={user} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden sm:flex">
        <NavbarContent user={user} />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden sm:flex" />
    </>
  );
}
