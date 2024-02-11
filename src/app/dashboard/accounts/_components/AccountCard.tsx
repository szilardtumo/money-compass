import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AccountCardProps {
  name: string;
  value: number;
  currency: string;
}

export function AccountCard({ name, value, currency }: AccountCardProps) {
  const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    value,
  );
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <p className="text-xs text-muted-foreground">Total of all subaccounts</p>
      </CardContent>
    </Card>
  );
}
