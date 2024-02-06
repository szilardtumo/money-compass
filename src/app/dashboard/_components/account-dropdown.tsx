'use client';

import { CaretDownIcon } from '@radix-ui/react-icons';
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AccountDropdownProps {
  user: User;
}

export function AccountDropdown({ user }: AccountDropdownProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClientComponentClient();
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
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
