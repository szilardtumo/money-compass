import Link from 'next/link';

import { AccountActionsDropdown } from '@/components/cards/accounts-card/account-actions-dropdown';
import { TransactionDayList } from '@/components/transactions/transaction-day-list';
import { AccountIcon } from '@/components/ui/account-avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { capitalize, formatCurrency } from '@/lib/utils/formatters';
import {
  formatPeriodLabel,
  formatPeriodParam,
  getChartMonths,
  getPeriodRange,
  parsePeriod,
  shiftPeriod,
} from '@/lib/utils/periods';
import { apiQueries } from '@/server/api/queries';

import { DrawerSheet, TAB_CONTENT } from './drawer-sheet';

const COLOR = 'var(--chart-1)';

/**
 * The drawer of an account, with its balance and its change in the period, its month-end balances,
 * its transactions of the period and its subaccounts.
 */
export async function AccountDrawer({ accountId, period }: { accountId: string; period: string }) {
  const selected = parsePeriod(period);
  const { start, end } = getPeriodRange(selected);
  const [accounts, history, { data: transactions }, categories, integrations, { mainCurrency }] =
    await Promise.all([
      apiQueries.accounts.getAccounts(),
      apiQueries.transactions.getTransactionHistory(),
      apiQueries.transactions.getTransactions({
        accountId,
        fromDate: start.toISOString(),
        toDate: new Date(end.getTime() - 1).toISOString(),
        pageSize: 1000,
      }),
      apiQueries.categories.getCategories(),
      apiQueries.integrations.getIntegrations(),
      apiQueries.currencies.getMainCurrencyWithMapper(),
    ]);
  const account = accounts.find((item) => item.id === accountId);
  // A deleted account closes the drawer
  if (!account) {
    return null;
  }

  const balances = new Map(
    history.map((point) => [
      new Date(point.date).toISOString().slice(0, 7),
      point.accountBalances[account.id]?.totalBalance ?? 0,
    ]),
  );
  const currentMonth = formatPeriodParam(parsePeriod(undefined));
  const months = getChartMonths(period);
  const firstMonth = selected.unit === 'month' ? period : months[0];
  const lastMonth = months
    .filter((month) => month.startsWith(period) && month <= currentMonth)
    .at(-1);
  const balance = balances.get(lastMonth ?? firstMonth) ?? 0;
  const before = balances.get(formatPeriodParam(shiftPeriod(parsePeriod(firstMonth), -1))) ?? 0;
  const label = formatPeriodLabel(selected);
  const syncedWith = new Map(
    integrations.flatMap((integration) =>
      integration.accounts.map((item) => [
        item.subaccountId,
        `${integration.institutionName} (${item.name || item.iban})`,
      ]),
    ),
  );

  return (
    <DrawerSheet
      icon={<AccountIcon category={account.category} className="size-5 text-(--chart-1)" />}
      color={COLOR}
      title={account.name}
      description={[
        capitalize(account.category),
        [...new Set(account.subaccounts.map((item) => item.originalCurrency.toUpperCase()))].join(
          ', ',
        ),
      ]
        .filter(Boolean)
        .join(' · ')}
      actions={<AccountActionsDropdown account={account} />}
      period={period}
      stats={[
        {
          label: lastMonth === currentMonth ? 'Balance now' : `Balance at the end of ${label}`,
          value: balance,
        },
        { label: `Change in ${label}`, value: balance - before },
      ]}
      chart={months.map((month) => (month <= currentMonth ? (balances.get(month) ?? 0) : 0))}
      mainCurrency={mainCurrency}
    >
      <Tabs defaultValue="transactions" className="min-h-0 flex-1">
        <TabsList className="mx-4">
          <TabsTrigger value="transactions">Transactions {transactions.length}</TabsTrigger>
          <TabsTrigger value="subaccounts">Subaccounts {account.subaccounts.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className={TAB_CONTENT}>
          <TransactionDayList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
          />
        </TabsContent>
        <TabsContent value="subaccounts" className={TAB_CONTENT}>
          {!account.subaccounts.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Edit the account to add a subaccount.
            </p>
          )}
          <ul className="flex flex-col divide-y">
            {account.subaccounts.map((subaccount) => (
              <li key={subaccount.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{subaccount.name}</p>
                  {syncedWith.has(subaccount.id) && (
                    <Link
                      href="/dashboard/integrations"
                      className="text-xs text-muted-foreground underline underline-offset-4"
                    >
                      Synced with {syncedWith.get(subaccount.id)}
                    </Link>
                  )}
                </div>
                <span className="font-medium whitespace-nowrap">
                  {formatCurrency(subaccount.balance.originalValue, subaccount.originalCurrency)}
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </DrawerSheet>
  );
}
