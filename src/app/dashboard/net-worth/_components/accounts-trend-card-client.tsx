'use client';

import { ChevronRightIcon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';

import {
  HISTORY_RANGES,
  getRangeLabel,
  sliceHistory,
  useHistoryRange,
} from '@/components/cards/net-worth-history-card/use-history-range';
import { AccountIcon } from '@/components/ui/account-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartColors } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account } from '@/lib/types/accounts.types';
import { capitalize, formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface AccountsTrendCardClientProps {
  accounts: Account[];
  /** The balance of each account at the end of each month, by account ID */
  history: Record<string, number>[];
  /** Of the first month of the history */
  firstDate: Date | undefined;
  /** The days since the oldest stale balance of an account, by account ID */
  staleDays: Record<string, number>;
  mainCurrency: string;
}

export function AccountsTrendCardClient({
  accounts,
  history,
  firstDate,
  staleDays,
  mainCurrency,
}: AccountsTrendCardClientProps) {
  const [range, setRange] = useHistoryRange();
  const points = sliceHistory(history, range);
  const format = (value: number, options: Intl.NumberFormatOptions = {}) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0, ...options });
  const formatChange = (from: number, to: number) => {
    const change = to - from;
    return [
      format(change, { signDisplay: 'exceptZero' }),
      from > 0 &&
        formatPercent(change / from, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
          signDisplay: 'exceptZero',
        }),
    ]
      .filter(Boolean)
      .join(' · ');
  };
  const total = accounts.reduce((sum, account) => sum + account.totalBalance, 0);
  const totalOf = (point: Record<string, number> | undefined) =>
    Object.values(point ?? {}).reduce((sum, value) => sum + value, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Balances now, change {getRangeLabel(range, firstDate)}</CardDescription>
        </div>
        <Tabs value={range} onValueChange={(value) => setRange(value as typeof range)}>
          <TabsList>
            {HISTORY_RANGES.map((item) => (
              <TabsTrigger key={item} value={item}>
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {accounts
            .toSorted((a, b) => b.totalBalance - a.totalBalance)
            .map((account, index) => {
              const color = chartColors[index % chartColors.length];
              const values = points.map((point) => point[account.id] ?? 0);
              const share = total > 0 ? Math.max(account.totalBalance / total, 0) : 0;
              const change = (values.at(-1) ?? 0) - (values[0] ?? 0);

              return (
                <li key={account.id}>
                  <Link
                    href={`/dashboard/accounts/${account.id}`}
                    className="-mx-2 block rounded-md px-2 py-2.5 hover:bg-muted/50"
                  >
                    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_4rem_6.5rem] items-center gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_6rem_7.5rem_7.5rem_1rem]">
                      <span
                        className="flex size-9 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                          color,
                        }}
                      >
                        <AccountIcon category={account.category} className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{account.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {staleDays[account.id] ? (
                            <span className="text-amber-600 dark:text-amber-500">
                              <TriangleAlertIcon className="mr-1 inline size-3 align-[-1px]" />
                              Updated {staleDays[account.id]} days ago
                            </span>
                          ) : (
                            [
                              capitalize(account.category),
                              [
                                ...new Set(
                                  account.subaccounts.map((item) =>
                                    item.originalCurrency.toUpperCase(),
                                  ),
                                ),
                              ].join(', '),
                            ].join(' · ')
                          )}
                        </p>
                      </div>
                      <TrendLine values={values} color={color} />
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(share, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          of net worth
                        </p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${share * 100}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold whitespace-nowrap">
                          {format(account.totalBalance)}
                        </p>
                        <p
                          className={
                            change > 0
                              ? 'text-xs text-success'
                              : change < 0
                                ? 'text-xs text-destructive'
                                : 'text-xs text-muted-foreground'
                          }
                        >
                          {formatChange(values[0] ?? 0, values.at(-1) ?? 0)}
                        </p>
                      </div>
                      <ChevronRightIcon className="hidden size-4 text-muted-foreground sm:block" />
                    </div>
                    {account.subaccounts.length > 1 &&
                      account.subaccounts.map((subaccount) => (
                        <div
                          key={subaccount.id}
                          className="flex justify-between gap-3 pt-1 pl-12 text-xs text-muted-foreground sm:pr-7"
                        >
                          <span className="truncate">{subaccount.name}</span>
                          <span className="whitespace-nowrap">
                            {subaccount.originalCurrency === mainCurrency
                              ? format(subaccount.balance.mainCurrencyValue)
                              : `${formatCurrency(subaccount.balance.originalValue, subaccount.originalCurrency, { maximumFractionDigits: 0 })} · ${format(subaccount.balance.mainCurrencyValue)}`}
                          </span>
                        </div>
                      ))}
                  </Link>
                </li>
              );
            })}
        </ul>
        <div className="mt-1 flex justify-between gap-3 border-t pt-3 text-sm font-semibold">
          <span>Total</span>
          <span>
            {format(total)}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              {formatChange(totalOf(points[0]), totalOf(points.at(-1)))}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * A line of the values with the area under it, stretched to its box.
 */
function TrendLine({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const spread = Math.max(...values) - min || 1;
  const line = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 28 - ((value - min) / spread) * 26;
      return `${index ? 'L' : 'M'}${x} ${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden className="h-8 w-full">
      <path d={`${line} L100 30 L0 30 Z`} fill={color} opacity={0.15} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
