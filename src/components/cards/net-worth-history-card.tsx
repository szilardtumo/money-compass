import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mainCurrency } from '@/lib/constants';
import { getCurrencyMapper } from '@/lib/db/currencies.queries';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

interface NetWorthHistoryCardProps {
  data: TransactionHistory[];
  accounts: SimpleAccount[];
}

export async function NetWorthHistoryCard({ data, accounts }: NetWorthHistoryCardProps) {
  const currencyMapper = await getCurrencyMapper(mainCurrency);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart accounts={accounts} currencyMapper={currencyMapper} data={data} />
      </CardContent>
    </Card>
  );
}
