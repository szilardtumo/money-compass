'use client';

import { AccountActionsDropdown } from '@/components/cards/accounts-card/account-actions-dropdown';
import { CreateAccountButton } from '@/components/cards/accounts-card/create-account-button';
import { NoAccountsPlaceholder } from '@/components/cards/accounts-card/no-accounts-placeholder';
import {
  getRangeLabel,
  sliceHistory,
  useHistoryRange,
} from '@/components/cards/net-worth-history-card/use-history-range';
import { DrawerLink } from '@/components/drawers/drawer-link';
import { AccountIcon } from '@/components/ui/account-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartColors } from '@/components/ui/chart';
import { TrendLine } from '@/components/ui/trend-line';
import { Account } from '@/lib/types/accounts.types';
import { capitalize, formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface AccountsTrendCardClientProps {
  accounts: Account[];
  /** The balance of each account at the end of each month, by account ID */
  history: Record<string, number>[];
  /** Of the first month of the history */
  firstDate: Date | undefined;
  mainCurrency: string;
}

export function AccountsTrendCardClient({
  accounts,
  history,
  firstDate,
  mainCurrency,
}: AccountsTrendCardClientProps) {
  const [range] = useHistoryRange();
  const points = sliceHistory(history, range);
  const format = (value: number, options: Intl.NumberFormatOptions = {}) =>
    formatCurrency(value, mainCurrency, { maximumFractionDigits: 0, ...options });
  const formatChange = (from: number, to: number) => {
    const change = to - from;
    return [
      format(change, { signDisplay: 'exceptZero' }),
      from > 0 &&
        formatPercent(change / from, { maximumFractionDigits: 1, signDisplay: 'exceptZero' }),
    ]
      .filter(Boolean)
      .join(' · ');
  };
  const total = accounts.reduce((sum, account) => sum + account.totalBalance, 0);
  const totalOf = (point: Record<string, number> | undefined) =>
    Object.values(point ?? {}).reduce((sum, value) => sum + value, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Balances now, change {getRangeLabel(range, firstDate)}</CardDescription>
        </div>
        <CreateAccountButton />
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
                <li key={account.id} className="flex items-start gap-1">
                  <DrawerLink
                    to={{ account: account.id }}
                    className="-ml-2 block min-w-0 flex-1 rounded-md px-2 py-2.5 hover:bg-muted/50"
                  >
                    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_4rem_6.5rem] items-center gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_6rem_7.5rem_7.5rem]">
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
                          {[
                            capitalize(account.category),
                            [
                              ...new Set(
                                account.subaccounts.map((item) =>
                                  item.originalCurrency.toUpperCase(),
                                ),
                              ),
                            ].join(', '),
                          ].join(' · ')}
                        </p>
                      </div>
                      <TrendLine values={values} color={color} />
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(share, { maximumFractionDigits: 0 })} of net worth
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
                    </div>
                    {account.subaccounts.length > 1 &&
                      account.subaccounts.map((subaccount) => (
                        <div
                          key={subaccount.id}
                          className="flex justify-between gap-3 pt-1 pl-12 text-xs text-muted-foreground"
                        >
                          <span className="truncate">{subaccount.name}</span>
                          <span className="whitespace-nowrap">
                            {subaccount.originalCurrency === mainCurrency
                              ? format(subaccount.balance.mainCurrencyValue)
                              : `${formatCurrency(subaccount.balance.originalValue, subaccount.originalCurrency, { maximumFractionDigits: 0 })} · ${format(subaccount.balance.mainCurrencyValue)}`}
                          </span>
                        </div>
                      ))}
                  </DrawerLink>
                  <AccountActionsDropdown account={account} className="mt-3.5" />
                </li>
              );
            })}
        </ul>
        {!accounts.length && <NoAccountsPlaceholder />}
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
