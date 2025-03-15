'use client';

import { useState } from 'react';

import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

interface NetWorthHistoryCardProps {
  transactionHistory: TransactionHistory[];
  accounts: Account[];
}

export function NetWorthHistoryCardClient({
  transactionHistory,
  accounts,
}: NetWorthHistoryCardProps) {
  const [stack, setStack] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row space-y-0 gap-4 justify-between">
        <CardTitle>Net Worth</CardTitle>
        <div className="flex items-center gap-2">
          <Switch id="stack" checked={stack} onCheckedChange={setStack} />
          <Label htmlFor="stack">Stack accounts</Label>
        </div>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart accounts={accounts} data={transactionHistory} stack={stack} />
      </CardContent>
    </Card>
  );
}
