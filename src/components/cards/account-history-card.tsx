import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { SimpleAccount } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AccountHistoryCardProps {
  data: TransactionHistory[];
  account: SimpleAccount;
}

export async function AccountHistoryCard({ data, account }: AccountHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{account.name} account</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart
          accounts={[account]}
          subaccountIdsToShow={[account.subaccountId]}
          data={data}
        />
      </CardContent>
    </Card>
  );
}
