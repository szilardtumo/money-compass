'use client';

import { CaretDownIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { User } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

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
import { createBrowserSupabaseClient } from '@/lib/utils/supabase/client';

interface AccountDropdownProps {
  user: User;
}

export function AccountDropdown({ user }: AccountDropdownProps) {
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const displayedName = user.user_metadata?.name ?? user.email ?? 'Account';
  const initials = displayedName
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full flex justify-between">
          <Avatar className="w-6 h-6 mr-2">
            <AvatarImage src={user.user_metadata?.picture} alt="avatar" />
            <AvatarFallback delayMs={600} className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span className="truncate">{displayedName}</span>
          <CaretDownIcon className="shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)] min-w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
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
        <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
