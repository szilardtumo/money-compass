import { CubeIcon, MixIcon } from '@radix-ui/react-icons';

import { AccountIcon } from '@/components/ui/account-avatar';
import { Separator } from '@/components/ui/separator';
import { getSimpleAccounts } from '@/lib/db/accounts.queries';

import { NavItem } from './nav-item';

export async function Navbar() {
  const accounts = await getSimpleAccounts();

  return (
    <nav className="flex flex-col gap-1 p-2">
      <NavItem href="/dashboard">
        <CubeIcon className="mr-2" /> Dashboard
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
  );
}
