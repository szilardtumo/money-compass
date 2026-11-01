'use client';

import { useState } from 'react';

import { TransactionHistoryChart } from '@/components/charts/transaction-history-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { TransactionHistory } from '@/lib/types/transactions.types';
import { formatDate } from '@/lib/utils/formatters';

interface NetWorthHistoryCardProps {
  /** Monthly, from the first month with a transaction */
  transactionHistory: TransactionHistory[];
  accounts: Account[];
}

type Range = '6M' | '1Y' | 'YTD' | 'All';

export function NetWorthHistoryCardClient({
  transactionHistory,
  accounts,
}: NetWorthHistoryCardProps) {
  const [range, setRange] = useState<Range>('1Y');
  const [view, setView] = useState<'total' | 'account' | 'category'>('total');
  const months = { '6M': 6, '1Y': 12, YTD: new Date().getUTCMonth(), All: Infinity }[range];
  // A point is the balance at the end of its month, so the range starts with the one before it
  const data = transactionHistory.slice(-(months + 2));

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
          <Tabs value={range} onValueChange={(value) => setRange(value as Range)}>
            <TabsList>
              {(['6M', '1Y', 'YTD', 'All'] as const).map((item) => (
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
          changeLabel={
            {
              '6M': 'in 6 months',
              '1Y': 'in a year',
              YTD: 'this year',
              All: data[0] && `since ${formatDate(data[0].date, 'MMMM yyyy')}`,
            }[range]
          }
        />
      </CardContent>
    </Card>
  );
}
