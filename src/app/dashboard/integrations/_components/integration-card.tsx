import { cn } from 'cn';
import { TriangleAlertIcon } from 'lucide-react';

import { DrawerLink } from '@/components/drawers/drawer-link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { formatDate } from '@/lib/utils/formatters';
import { integrationProviders } from '@/server/api/integrations/providers';

import { IntegrationAccountActions } from './integration-account-actions';
import { IntegrationCardActions } from './integration-card-actions';
import { RelativeTime } from './relative-time';

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
  /** The number of correction transactions by subaccount */
  correctionCounts: Record<string, number>;
}

export function IntegrationCard({
  integration,
  accounts,
  linkedSubaccountIds,
  correctionCounts,
}: IntegrationCardProps) {
  const { dailySyncLimit } = integrationProviders[integration.provider];
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
      <CardContent className="flex flex-col gap-4">
        {integration.provider === 'ibkr_flex' && integration.status !== 'active' && (
          <Alert>
            <TriangleAlertIcon />
            <AlertTitle>Create a new Flex token</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  In IBKR&apos;s Client Portal, open Performance & Reports, then Flex Queries.
                </li>
                <li>
                  Under Flex Web Service Configuration, create a token with a one-year lifetime and
                  no IP restriction.
                </li>
                <li>
                  Click Renew access, then enter the new token, the same query ID and the
                  token&apos;s expiry date.
                </li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
        {integration.accounts.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank account</TableHead>
                <TableHead>Subaccount</TableHead>
                <TableHead>Last successful sync</TableHead>
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
                const [lastLog] = account.syncLogs;
                // Of the last sync that succeeded, so a failed sync doesn't hide a mismatch
                const lastWarning = account.syncLogs.find((log) => !log.error)?.warning;

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
                        <DrawerLink
                          to={{ account: linked.accountId }}
                          className="underline underline-offset-4"
                        >
                          {linked.label}
                        </DrawerLink>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.lastSyncedAt ? (
                        <>
                          <p>
                            <RelativeTime date={account.lastSyncedAt} />
                          </p>
                          <p className="text-muted-foreground">
                            {account.syncsToday} of {dailySyncLimit} syncs used today
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                      {lastLog?.error && (
                        <p className="max-w-72 whitespace-normal text-destructive">
                          The last sync failed: {lastLog.error}
                        </p>
                      )}
                      {lastWarning && (
                        <p className="max-w-72 whitespace-normal text-amber-600 dark:text-amber-500">
                          {lastWarning}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <IntegrationAccountActions
                        integrationAccountId={account.id}
                        provider={integration.provider}
                        currency={account.currency}
                        linkedLabel={linked?.label}
                        options={[...subaccounts]
                          .filter(
                            ([id, subaccount]) =>
                              subaccount.currency === account.currency &&
                              !linkedSubaccountIds.has(id),
                          )
                          .map(([id, subaccount]) => ({
                            label: subaccount.label,
                            value: id,
                            corrections: correctionCounts[id] ?? 0,
                          }))}
                        canSync={
                          (integration.status === 'active' || integration.status === 'expiring') &&
                          account.syncsToday < dailySyncLimit
                        }
                        syncLogs={account.syncLogs}
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
