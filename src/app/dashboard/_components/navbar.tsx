import {
  ChartColumnIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PlugIcon,
  StoreIcon,
  TagsIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { Suspense } from 'react';

import { AccountSection } from '@/app/dashboard/_components/account-section';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { apiQueries } from '@/server/api/queries';

import { MainCurrencySelect } from './main-currency-select';
import { NavItem } from './nav-item';

async function NavbarMainCurrency() {
  const [profile, currencies] = await Promise.all([
    apiQueries.profiles.getProfile(),
    apiQueries.currencies.getCurrencies(),
  ]);

  return <MainCurrencySelect mainCurrency={profile.mainCurrency} currencies={currencies} />;
}

function NavbarContent() {
  return (
    <aside className="w-full">
      <div className="flex h-14 items-center justify-center px-2">
        <Suspense fallback={<Skeleton className="w-full h-9" />}>
          <AccountSection />
        </Suspense>
      </div>
      <Separator />
      <nav className="flex flex-col gap-1 p-2">
        <NavItem href="/dashboard" icon={<LayoutDashboardIcon className="size-4 mr-2" />}>
          Dashboard
        </NavItem>
        <NavItem href="/dashboard/net-worth" icon={<TrendingUpIcon className="size-4 mr-2" />}>
          Net worth
        </NavItem>
        <NavItem href="/dashboard/transactions" icon={<HistoryIcon className="size-4 mr-2" />}>
          Transactions
        </NavItem>
        <NavItem href="/dashboard/analytics" icon={<ChartColumnIcon className="size-4 mr-2" />}>
          Analytics
        </NavItem>
        <div className="pl-4 flex flex-col gap-1">
          <NavItem
            href="/dashboard/analytics/merchants"
            icon={<StoreIcon className="size-4 mr-2" />}
          >
            Merchants
          </NavItem>
          <NavItem
            href="/dashboard/analytics/categories"
            icon={<TagsIcon className="size-4 mr-2" />}
          >
            Categories
          </NavItem>
        </div>
        <NavItem href="/dashboard/integrations" icon={<PlugIcon className="size-4 mr-2" />}>
          Integrations
        </NavItem>
      </nav>
      <Separator />
      <div className="flex flex-col gap-2 p-4">
        <Label htmlFor="main-currency" className="text-muted-foreground">
          Main currency
        </Label>
        <Suspense fallback={<Skeleton className="h-9 w-full" />}>
          <NavbarMainCurrency />
        </Suspense>
      </div>
    </aside>
  );
}

export function Navbar() {
  return (
    <>
      {/* Mobile */}
      <div className="absolute sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="m-[10px]">
              <MenuIcon className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-6">
            <NavbarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <ResizablePanel
        id="navbar-panel"
        defaultSize="20%"
        minSize="15%"
        maxSize="30%"
        className="hidden sm:flex"
      >
        <NavbarContent />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden sm:flex" />
    </>
  );
}
