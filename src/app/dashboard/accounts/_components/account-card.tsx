import { Card, CardContent, CardHeader, CardMetric, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatters';

interface AccountCardProps {
  name: string;
  value: number;
  currency: string;
}

export function AccountCard({ name, value, currency }: AccountCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardMetric>{formatCurrency(value, currency)}</CardMetric>
      </CardContent>
    </Card>
  );
}
