'use client';

import { EllipsisIcon, LinkIcon, RefreshCwIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Selectbox } from '@/components/ui/selectbox';
import { useActionWithToast } from '@/hooks/useActionWithToast';
import { apiActions } from '@/server/api/actions';

interface IntegrationAccountActionsProps {
  integrationAccountId: string;
  currency: string;
  /** Label of the linked subaccount, undefined if the bank account isn't linked */
  linkedLabel: string | undefined;
  /** Subaccounts with the same currency that aren't linked to a bank account */
  options: { label: string; value: string }[];
  canSync: boolean;
}

export function IntegrationAccountActions({
  integrationAccountId,
  currency,
  linkedLabel,
  options,
  canSync,
}: IntegrationAccountActionsProps) {
  const [dialog, setDialog] = useState<'link' | 'unlink'>();
  const [subaccountId, setSubaccountId] = useState<string>();

  const { execute: setLink, isPending: isLinkPending } = useActionWithToast(
    apiActions.integrations.setIntegrationAccountLink,
    {
      loadingToast: 'Saving link...',
      successToast: ({ input }) =>
        input.subaccountId ? 'Subaccount linked!' : 'Subaccount unlinked!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to save the link',
        description: errorMessage,
      }),
      onSuccess: () => setDialog(undefined),
    },
  );
  const { execute: sync, isPending: isSyncPending } = useActionWithToast(
    apiActions.integrations.syncIntegrationAccount,
    {
      loadingToast: 'Syncing transactions...',
      successToast: 'Transactions synced!',
      errorToast: ({ errorMessage }) => ({
        title: 'Failed to sync transactions',
        description: errorMessage,
      }),
    },
  );

  return (
    <div className="flex justify-end gap-2">
      {linkedLabel ? (
        <>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCwIcon}
            isLoading={isSyncPending}
            disabled={!canSync || isSyncPending}
            onClick={() => sync(integrationAccountId)}
          >
            Sync
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" icon={EllipsisIcon} className="size-8">
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDialog('link')}>
                Change subaccount
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog('unlink')}>Unlink</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <Button variant="outline" size="sm" icon={LinkIcon} onClick={() => setDialog('link')}>
          Link subaccount
        </Button>
      )}

      <Dialog open={dialog === 'link'} onOpenChange={(open) => !open && setDialog(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkedLabel ? 'Change subaccount' : 'Link subaccount'}</DialogTitle>
            <DialogDescription>
              Syncing imports the bank account&apos;s booked transactions into the subaccount,
              starting today. Older transactions aren&apos;t imported: a correction transaction sets
              the subaccount&apos;s balance to the bank&apos;s balance instead.
              {linkedLabel &&
                ` The transactions already synced stay in ${linkedLabel}, which stops syncing.`}
            </DialogDescription>
          </DialogHeader>
          {options.length ? (
            <Selectbox
              aria-label="Subaccount"
              placeholder={`Select a ${currency.toUpperCase()} subaccount`}
              options={options}
              value={subaccountId}
              onValueChange={setSubaccountId}
            />
          ) : (
            <p className="text-sm">
              There are no unlinked {currency.toUpperCase()} subaccounts. Add one on the{' '}
              <Link href="/dashboard/accounts" className="underline">
                accounts page
              </Link>
              .
            </p>
          )}
          <DialogFooter>
            <Button
              isLoading={isLinkPending}
              disabled={!subaccountId || isLinkPending}
              onClick={() => setLink({ integrationAccountId, subaccountId: subaccountId! })}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={dialog === 'unlink'}
        onOpenChange={(open) => !open && setDialog(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink {linkedLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              The transactions already synced stay in the subaccount. Syncing stops until you link a
              subaccount again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setLink({ integrationAccountId, subaccountId: null })}
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
