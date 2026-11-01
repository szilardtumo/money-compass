'use client';

import { useState } from 'react';

import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';

import { HISTORY_RANGES, getRangeLabel, sliceHistory, useHistoryRange } from './use-history-range';

interface NetWorthHistoryCardProps {
  /** Monthly, from the first month with a transaction */
  transactionHistory: TransactionHistory[];
  accounts: Account[];
}

export function NetWorthHistoryCardClient({
  transactionHistory,
  accounts,
}: NetWorthHistoryCardProps) {
  const [range, setRange] = useHistoryRange();
  const [view, setView] = useState<'total' | 'account' | 'category'>('total');
  const data = sliceHistory(transactionHistory, range);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Net worth</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Tabs value={view} onValueChange={(value) => setView(value as typeof view)}>
            <TabsList>
              <TabsTrigger value="total">Total</TabsTrigger>
              <TabsTrigger value="account">Accounts</TabsTrigger>
              <TabsTrigger value="category">Categories</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={range} onValueChange={(value) => setRange(value as typeof range)}>
            <TabsList>
              {HISTORY_RANGES.map((item) => (
                <TabsTrigger key={item} value={item}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TransactionHistoryChart
          accounts={accounts}
          data={data}
          stack={view !== 'total' && view}
          changeLabel={getRangeLabel(range, data[0]?.date)}
        />
      </CardContent>
    </Card>
  );
}
