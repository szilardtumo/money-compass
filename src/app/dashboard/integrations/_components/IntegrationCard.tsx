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
        {integration.accounts.length ? (
          <Table>
            <TableCaption>A list accounts available to link</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Account name</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integration.accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name || account.iban}</TableCell>
                  <TableCell>{account.iban}</TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell>Unlinked</TableCell>
                </TableRow>
              ))}
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
        <IntegrationCardActions integration={integration} />
      </CardFooter>
    </Card>
  );
}
