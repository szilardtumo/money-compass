'use client';

import { Label } from '@radix-ui/react-label';
import { useState } from 'react';

import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

interface AccountHistoryCardProps {
  data: TransactionHistory[];
  account: Account;
  title?: string;
}

export function AccountHistoryCard({
  data,
  account,
  title = `${account.name} account`,
}: AccountHistoryCardProps) {
  const [stack, setStack] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row space-y-0 gap-4 justify-between">
        <CardTitle>{title}</CardTitle>
        {account.subaccounts.length > 1 && (
          <div className="flex items-center gap-2">
            <Switch id="stack" checked={stack} onCheckedChange={setStack} />
            <Label htmlFor="stack">Stack subaccounts</Label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart accounts={[account]} data={data} stack={stack} />
      </CardContent>
    </Card>
  );
}
