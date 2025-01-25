import { formatDistanceToNow, isFuture } from 'date-fns';

import { IntegrationCardActions } from '@/app/dashboard/integrations/_components/IntegrationCardActions';
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
import { cn } from '@/lib/cn';
import { Integration } from '@/lib/types/integrations.types';

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
        {integration.expiresAt && (
          <p>
            {isFuture(integration.expiresAt) ? 'Expires' : 'Expired'}{' '}
            {formatDistanceToNow(integration.expiresAt, { addSuffix: true })}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <IntegrationCardActions integration={integration} />
      </CardFooter>
    </Card>
  );
}
