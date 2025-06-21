'use client';

import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MouseEvent, useState } from 'react';

import { useUpsertAccountDialog } from '@/components/dialogs/upsert-account-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { Account } from '@/lib/types/accounts.types';
import { apiActions } from '@/server/api/actions';

interface AccountActionButtonsProps {
  account: Account;
}

export function AccountActionButtons({ account }: AccountActionButtonsProps) {
  const router = useRouter();

  const { openDialog: openEditDialog } = useUpsertAccountDialog();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { executeAsync: executeDeleteAccount, isPending } = useActionWithToast(
    apiActions.accounts.deleteAccount,
    {
      loadingToast: 'Deleting account...',
      successToast: 'Account deleted!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to delete account',
        description: errorMessage,
      }),
    },
  );

  const handleDelete = async (e: MouseEvent) => {
    e.preventDefault();
    await executeDeleteAccount({ accountId: account.id });
    setDeleteDialogOpen(false);
    router.replace('/dashboard');
  };

  return (
    <div className="flex gap-2">
      <Button icon={Pencil1Icon} onClick={() => openEditDialog(account)}>
        Edit
      </Button>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <TrashIcon />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Delete account</TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete the account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently the <strong>{account.name}</strong>{' '}
              account with all of its subaccounts and transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} variant="destructive" onClick={handleDelete}>
              {isPending && <Loader className="mr-2 size-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
