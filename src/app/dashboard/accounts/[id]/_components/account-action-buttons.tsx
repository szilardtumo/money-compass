'use client';

import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MouseEvent, useState } from 'react';
import { toast } from 'sonner';

import { useUpsertAccountDialog } from '@/components/providers/upsert-account-dialog-provider';
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
import { Account } from '@/lib/types/accounts.types';
import { createToastPromise } from '@/lib/utils/toasts';
import { apiActions } from '@/server/api/actions';

interface AccountActionButtonsProps {
  account: Account;
}

export function AccountActionButtons({ account }: AccountActionButtonsProps) {
  const router = useRouter();

  const { openDialog: openEditDialog } = useUpsertAccountDialog();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    const promise = apiActions.accounts.deleteAccount(account.id);

    toast.promise(createToastPromise(promise), {
      loading: 'Deleting account...',
      success: 'Account deleted!',
      error: () => 'Failed to delete account. Please try again later.',
    });

    await promise;
    setDeleteDialogOpen(false);
    setIsDeleting(false);
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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} variant="destructive" onClick={handleDelete}>
              {isDeleting && <Loader className="mr-2 size-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
