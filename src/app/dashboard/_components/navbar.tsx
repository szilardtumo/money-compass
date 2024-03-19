import { CubeIcon, IdCardIcon, MixIcon } from '@radix-ui/react-icons';

import { NavItem } from './nav-item';

export function Navbar() {
  return (
    <nav className="flex flex-col gap-1 p-2">
      <NavItem href="/dashboard">
        <CubeIcon className="mr-2" /> Dashboard
      </NavItem>
      <NavItem href="/dashboard/accounts">
        <IdCardIcon className="mr-2" /> Accounts
      </NavItem>
      <NavItem href="/dashboard/test">
        <MixIcon className="mr-2" /> Test
      </NavItem>
    </nav>
  );
}
