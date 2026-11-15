'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isFuture } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useHookFormActionWithToast } from '@/hooks/useActionWithToast';
import { connectIbkrSchema } from '@/lib/validation/integrations';
import { apiActions } from '@/server/api/actions';

function ConnectIbkrForm({ onSuccess }: { onSuccess: () => void }) {
  const { form, handleSubmitWithAction, action } = useHookFormActionWithToast(
    apiActions.integrations.connectIbkr,
    zodResolver(connectIbkrSchema),
    {
      actionProps: {
        loadingToast: 'Connecting to IBKR...',
        successToast: 'IBKR connected!',
        errorToast: ({ errorMessage }) => ({
          title: 'Failed to connect to IBKR',
          description: errorMessage,
        }),
        onSuccess,
      },
      formProps: { defaultValues: { token: '', queryId: '' } },
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="flex flex-col space-y-8">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flex Web Service token</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="queryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Query ID</FormLabel>
              <FormControl>
                <Input inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Token expiry date</FormLabel>
              <FormControl>
                <DatePicker
                  disabled={(date) => !isFuture(date)}
                  onValueChange={onChange}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="self-stretch sm:self-end"
          disabled={action.isPending}
          isLoading={action.isPending}
        >
          Connect
        </Button>
      </form>
    </Form>
  );
}

/** Connects IBKR, or renews the token of a connected query. The children open the dialog. */
export function ConnectIbkrDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Interactive Brokers</DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>The app reads your IBKR activity through a Flex query. To create one:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>
                  In IBKR&apos;s Client Portal, open Performance & Reports, then Flex Queries.
                </li>
                <li>
                  Create an Activity Flex Query in XML format with these sections: Account
                  Information, Cash Report, Cash Transactions, Corporate Actions, Financial
                  Instrument Information, Net Asset Value, Open Positions and Trades.
                </li>
                <li>
                  Under Flex Web Service Configuration, enable the service and create a token with a
                  one-year lifetime and no IP restriction.
                </li>
              </ol>
            </div>
          </DialogDescription>
        </DialogHeader>
        <ConnectIbkrForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
