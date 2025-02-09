import { formatDistanceToNow, isToday } from 'date-fns';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { DAILY_SYNC_COUNT_LIMIT } from '@/lib/constants/integrations';
import { Integration } from '@/lib/types/integrations.types';

import { IntegrationCardActions } from './IntegrationCardActions';
import { LinkIntegrationDialog } from './LinkIntegrationDialog';
import { SynchronizeIntegrationLinkAction } from './SynchronizeIntegrationLinkAction';
import { UnlinkIntegrationAction } from './UnlinkIntegrationAction';

const statusColor = {
  unconfirmed: 'bg-amber-500',
  active: 'bg-green-500',
  expired: 'bg-red-500',
  unknown: 'bg-gray-500',
};

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-6 p-6">
        <Avatar className="size-8">
          <AvatarImage src={integration.institution.logoUrl} />
          <AvatarFallback>{integration.institution.name[0]}</AvatarFallback>
        </Avatar>

        <CardHeader className="p-0">
          <CardTitle>{integration.institution.name}</CardTitle>
          <CardDescription>{integration.institution.bic}</CardDescription>
        </CardHeader>

        <Badge variant="secondary" className="ml-auto self-start gap-1.5 capitalize">
          <span
            className={cn('size-2 rounded-full', statusColor[integration.status])}
            aria-hidden="true"
          />
          {integration.status}
        </Badge>
      </div>
      <CardContent>
        {integration.accounts.length ? (
          <Table>
            <TableCaption>A list accounts available to link</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead colSpan={2}>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integration.accounts.map((account) => {
                const link = integration.links.find(
                  (link) => link.integrationAccountId === account.id,
                );

                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <p>{account.name || account.iban}</p>
                      {!!account.name && <p className="text-muted-foreground">{account.iban}</p>}
                    </TableCell>
                    <TableCell className="uppercase">
                      <Badge variant="secondary">{account.currency}</Badge>
                    </TableCell>

                    <TableCell>
                      {link ? (
                        <>
                          <p>
                            Linked to{' '}
                            <Link
                              href={`/dashboard/accounts/${link.subaccount.accountId}`}
                              className="hover:underline"
                            >
                              {link.subaccount.name}
                            </Link>
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {link.lastSyncedAt
                              ? `Last synced ${formatDistanceToNow(link.lastSyncedAt, {
                                  addSuffix: true,
                                })} (${
                                  isToday(link.lastSyncedAt) ? link.syncCount : 0
                                }/${DAILY_SYNC_COUNT_LIMIT})`
                              : 'Never synced'}
                          </p>
                        </>
                      ) : (
                        <p className="italic">Unlinked</p>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <Suspense fallback={<Loader />}>
                        {link ? (
                          <div className="flex justify-end gap-2">
                            <SynchronizeIntegrationLinkAction linkId={link.id} />
                            <UnlinkIntegrationAction linkId={link.id} />
                          </div>
                        ) : (
                          <LinkIntegrationDialog
                            integration={integration}
                            integrationAccountId={account.id}
                          />
                        )}
                      </Suspense>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            No accounts available.
            <br />
            {integration.status === 'active' &&
              "Make sure to allow access to the accounts you want to link on the institution's website."}
            {integration.status === 'unconfirmed' &&
              "Confirm the integration on the institution's website to see the available accounts."}
            {integration.status === 'expired' &&
              "Renew the integration on the institution's website to see the available accounts."}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Suspense>
          <IntegrationCardActions integration={integration} />
        </Suspense>
      </CardFooter>
    </Card>
  );
}
