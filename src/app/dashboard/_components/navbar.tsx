import {
  CardStackIcon,
  CounterClockwiseClockIcon,
  CubeIcon,
  HamburgerMenuIcon,
  MixIcon,
  PieChartIcon,
} from '@radix-ui/react-icons';
import { Suspense } from 'react';

import { AccountIcon } from '@/components/ui/account-avatar';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Currency } from '@/lib/types/currencies.types';
import { Profile } from '@/lib/types/profiles.types';
import { apiQueries } from '@/server/api/queries';

import { AccountDropdown } from './account-dropdown';
import { NavItem } from './nav-item';

function NavbarAccountItemsSkeleton() {
  return (
    <div className="pl-8 flex flex-col gap-1">
      <Skeleton className="h-5 my-2 w-20 max-w-full" />
      <Skeleton className="h-5 my-2 w-12 max-w-full" />
      <Skeleton className="h-5 my-2 w-28 max-w-full" />
    </div>
  );
}

async function NavbarAccountItems() {
  const accounts = await apiQueries.accounts.getAccounts();

  return (
    <div className="pl-4 flex flex-col gap-1">
      {accounts.map((account) => (
        <NavItem
          key={account.id}
          href={`/dashboard/accounts/${account.id}`}
          icon={<AccountIcon category={account.category} className="w-4 h-4 mr-2" />}
        >
          {account.name}
        </NavItem>
      ))}
    </div>
  );
}

interface NavbarContentProps {
  profile: Profile;
  currencies: Currency[];
}

function NavbarContent({ profile, currencies }: NavbarContentProps) {
  return (
    <aside className="w-full">
      <div className="flex h-14 items-center justify-center px-2">
        <AccountDropdown profile={profile} currencies={currencies} />
      </div>
      <Separator />
      <nav className="flex flex-col gap-1 p-2">
        <NavItem href="/dashboard" icon={<CubeIcon className="mr-2" />}>
          Dashboard
        </NavItem>
        <NavItem
          href="/dashboard/transactions"
          icon={<CounterClockwiseClockIcon className="mr-2" />}
        >
          Transactions
        </NavItem>
        <NavItem href="/dashboard/statistics" icon={<PieChartIcon className="mr-2" />}>
          Statistics
        </NavItem>

        <Separator className="my-2" />

        <NavItem href="/dashboard/accounts" icon={<CardStackIcon className="mr-2" />}>
          All Accounts
        </NavItem>
        <Suspense fallback={<NavbarAccountItemsSkeleton />}>
          <NavbarAccountItems />
        </Suspense>

        {process.env.NODE_ENV === 'development' && (
          <>
            <Separator className="my-2" />

            <NavItem href="/dashboard/test" icon={<MixIcon className="mr-2" />}>
              Test
            </NavItem>
          </>
        )}
      </nav>
    </aside>
  );
}

interface NavbarProps {
  profile: Profile;
  currencies: Currency[];
}

export function Navbar({ profile, currencies }: NavbarProps) {
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
            <NavbarContent profile={profile} currencies={currencies} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden sm:flex">
        <NavbarContent profile={profile} currencies={currencies} />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden sm:flex" />
    </>
  );
}
