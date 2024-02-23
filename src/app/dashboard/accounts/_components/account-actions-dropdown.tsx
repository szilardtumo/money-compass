import { DotsHorizontalIcon } from '@radix-ui/react-icons';

import { AddTransactionMenuItem } from '@/app/dashboard/accounts/_components/add-transaction-menu-item';
import { DeleteAccountMenuItem } from '@/app/dashboard/accounts/_components/delete-account-menu-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SimpleAccount } from '@/lib/types/accounts.types';

interface AccountActionsDropdownProps {
  account: SimpleAccount;
}

export function AccountActionsDropdown({ account }: AccountActionsDropdownProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <DotsHorizontalIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuItem disabled>Edit</DropdownMenuItem>
        <AddTransactionMenuItem accountId={account.id} />
        <DropdownMenuSeparator />
        <DeleteAccountMenuItem accountId={account.id} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
