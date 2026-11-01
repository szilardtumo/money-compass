'use client';

import { useDrawerHref } from '@/components/drawers/drawer-link';
import { AccountIcon } from '@/components/ui/account-avatar';
import { Account } from '@/lib/types/accounts.types';

import { NavItem } from './nav-item';

/**
 * The accounts in the sidebar, which open their drawer on the current page.
 */
export function AccountNavItems({ accounts }: { accounts: Account[] }) {
  const getDrawerHref = useDrawerHref();

  return (
    <div className="pl-4 flex flex-col gap-1">
      {accounts.map((account) => (
        <NavItem
          key={account.id}
          href={getDrawerHref({ account: account.id })}
          icon={<AccountIcon category={account.category} className="w-4 h-4 mr-2" />}
        >
          {account.name}
        </NavItem>
      ))}
    </div>
  );
}
