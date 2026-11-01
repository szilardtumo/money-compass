'use client';

import { useState } from 'react';

import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

import { getRangeLabel, sliceHistory, useHistoryRange } from './use-history-range';

interface NetWorthHistoryCardProps {
  /** Monthly, from the first month with a transaction */
  transactionHistory: TransactionHistory[];
  accounts: Account[];
}

export function NetWorthHistoryCardClient({
  transactionHistory,
  accounts,
}: NetWorthHistoryCardProps) {
  const [range] = useHistoryRange();
  const [stack, setStack] = useState(false);
  const data = sliceHistory(transactionHistory, range);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <CardTitle>Net worth</CardTitle>
        <div className="flex items-center gap-2">
          <Switch id="stack" checked={stack} onCheckedChange={setStack} />
          <Label htmlFor="stack">Stack accounts</Label>
        </div>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart
          accounts={accounts}
          data={data}
          stack={stack}
          changeLabel={getRangeLabel(range, data[0]?.date)}
        />
      </CardContent>
    </Card>
  );
}
