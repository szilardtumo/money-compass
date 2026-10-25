import { cn } from 'cn';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Account } from '@/lib/types/accounts.types';
import { Integration } from '@/lib/types/integrations.types';
import { formatDate, formatDateTime } from '@/lib/utils/formatters';
import { DAILY_SYNC_LIMIT } from '@/server/api/integrations/sync';

import { IntegrationAccountActions } from './integration-account-actions';
import { IntegrationCardActions } from './integration-card-actions';

const statusColor = {
  active: 'bg-green-500',
  expiring: 'bg-amber-500',
  expired: 'bg-red-500',
  revoked: 'bg-red-500',
};

interface IntegrationCardProps {
  integration: Integration;
  accounts: Account[];
  /** Subaccounts linked to any bank account */
  linkedSubaccountIds: Set<string>;
}

export function IntegrationCard({
  integration,
  accounts,
  linkedSubaccountIds,
}: IntegrationCardProps) {
  const subaccounts = new Map(
    accounts.flatMap((item) =>
      item.subaccounts.map((subaccount) => [
        subaccount.id,
        {
          accountId: item.id,
          label: `${item.name} / ${subaccount.name}`,
          currency: subaccount.originalCurrency,
        },
      ]),
    ),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={integration.institutionLogoUrl} className="object-contain" />
            <AvatarFallback>{integration.institutionName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <CardTitle>{integration.institutionName}</CardTitle>
            <CardDescription>
              {integration.status === 'revoked'
                ? 'Access revoked by the bank'
                : `Access ${integration.status === 'expired' ? 'expired' : 'expires'} on ${formatDate(integration.expiresAt)}`}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <Badge variant="secondary" className="gap-1.5 capitalize">
            <span
              className={cn('size-2 rounded-full', statusColor[integration.status])}
              aria-hidden="true"
            />
            {integration.status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {integration.accounts.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank account</TableHead>
                <TableHead>Subaccount</TableHead>
                <TableHead>Last synced</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integration.accounts.map((account) => {
                const linked = account.subaccountId
                  ? subaccounts.get(account.subaccountId)
                  : undefined;

                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <p>
                        {account.name || account.iban}{' '}
                        <Badge variant="secondary" className="uppercase">
                          {account.currency}
                        </Badge>
                      </p>
                      {!!account.name && <p className="text-muted-foreground">{account.iban}</p>}
                    </TableCell>
                    <TableCell>
                      {linked ? (
                        <Link
                          href={`/dashboard/accounts/${linked.accountId}`}
                          className="underline underline-offset-4"
                        >
                          {linked.label}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.lastSyncedAt ? (
                        <>
                          <p>{formatDateTime(account.lastSyncedAt)}</p>
                          <p className="text-muted-foreground">
                            {account.syncsToday} of {DAILY_SYNC_LIMIT} syncs used today
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <IntegrationAccountActions
                        integrationAccountId={account.id}
                        currency={account.currency}
                        linkedLabel={linked?.label}
                        options={[...subaccounts]
                          .filter(
                            ([id, subaccount]) =>
                              subaccount.currency === account.currency &&
                              !linkedSubaccountIds.has(id),
                          )
                          .map(([id, subaccount]) => ({ label: subaccount.label, value: id }))}
                        canSync={
                          (integration.status === 'active' || integration.status === 'expiring') &&
                          account.syncsToday < DAILY_SYNC_LIMIT
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            The bank didn&apos;t share any accounts. Delete this integration and connect the bank
            again.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <IntegrationCardActions integration={integration} />
      </CardFooter>
    </Card>
  );
}
