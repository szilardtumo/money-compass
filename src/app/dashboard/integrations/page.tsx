import { formatDistanceToNow, isFuture } from 'date-fns';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { cn } from '@/lib/cn';
import { apiQueries } from '@/server/api/queries';
const statusColor = {
  pending: 'bg-warning',
  active: 'bg-success',
  expired: 'bg-destructive',
  unknown: 'bg-muted',
};

export default async function StatisticsPage() {
  const [integrations] = await Promise.all([apiQueries.integrations.getIntegrations()]);

  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Integrations</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        {integrations.map((integration) => (
          <Card key={integration.id}>
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
              {integration.expiresAt && (
                <p>
                  {isFuture(integration.expiresAt) ? 'Expires' : 'Expired'}{' '}
                  {formatDistanceToNow(integration.expiresAt, { addSuffix: true })}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 justify-between">
              <Button>Renew</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete this integration?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This unlinks it from the account and stops synchronizing transactions. The
                      already synchronized transactions will remain unchanged.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </PageContent>
    </PageLayout>
  );
}
