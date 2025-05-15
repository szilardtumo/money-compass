'use client';

import { CaretDownIcon, ExitIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';

import { useSupabaseAuth } from '@/components/providers/supabase-client-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOptimisticActionWithToast } from '@/hooks/useActionWithToast';
import { Currency } from '@/lib/types/currencies.types';
import { Profile } from '@/lib/types/profiles.types';
import { apiActions } from '@/server/api/actions';

interface AccountDropdownProps {
  profile: Profile;
  currencies: Currency[];
}

export function AccountDropdown({ profile, currencies }: AccountDropdownProps) {
  const supabaseAuth = useSupabaseAuth();
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();

  const { execute: executeUpdateProfile, optimisticState: optimisticMainCurrency } =
    useOptimisticActionWithToast(apiActions.profiles.updateProfile, {
      currentState: profile.mainCurrency,
      updateFn: (_, input) => input.mainCurrency,
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to change main currency',
        description: errorMessage,
      }),
    });

  const handleLogout = useCallback(async () => {
    await supabaseAuth.signOut();
    router.refresh();
  }, [router, supabaseAuth]);

  const handleMainCurrencyChange = useCallback(
    async (currencyId: string) => {
      if (currencyId !== profile.mainCurrency) {
        executeUpdateProfile({ mainCurrency: currencyId });
      }
    },
    [profile.mainCurrency, executeUpdateProfile],
  );

  const displayedName = profile.name ?? profile.email ?? 'Account';
  const initials = displayedName
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          icon={CaretDownIcon}
          iconPlacement="right"
          className="w-full flex justify-between"
        >
          <Avatar className="w-6 h-6 mr-2">
            <AvatarImage src={profile.picture} alt="avatar" />
            <AvatarFallback delayMs={600} className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span className="truncate">{displayedName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)] min-w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/integrations">Integrations</Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>App Theme</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="system">
                  System
                  <DropdownMenuShortcut>
                    {systemTheme === 'dark' ? <MoonIcon /> : <SunIcon />}
                  </DropdownMenuShortcut>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  Dark
                  <DropdownMenuShortcut>
                    <MoonIcon />
                  </DropdownMenuShortcut>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">
                  Light
                  <DropdownMenuShortcut>
                    <SunIcon />
                  </DropdownMenuShortcut>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Main currency</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={optimisticMainCurrency}
                onValueChange={handleMainCurrencyChange}
              >
                {currencies.map((currency) => (
                  <DropdownMenuRadioItem
                    key={currency.id}
                    value={currency.id}
                    onSelect={(e) => e.preventDefault()} // Prevents the dropdown menu from closing when selecting the item
                  >
                    {currency.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <ExitIcon className="mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
