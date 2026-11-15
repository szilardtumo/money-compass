import { subYears } from 'date-fns';

import { CurrencyMapper } from '@/lib/types/currencies.types';
import { InvestmentEntry } from '@/lib/types/investments.types';
import { toMainCurrency } from '@/lib/utils/currencies';
import { groupBy } from '@/lib/utils/group-by';

import { nextDay } from './valuation';

/** A subaccount of an investment account with broker transactions */
export interface BrokerSubaccount {
  id: string;
  accountName: string;
  currency: string;
  /** In the subaccount's currency */
  cash: number;
  /** The holdings at the latest valuation, in the subaccount's currency */
  marketValue: number;
  entries: InvestmentEntry[];
}

/** A position at its last close. Amounts are in the main currency unless named otherwise. */
export interface Holding {
  subaccountId: string;
  securityId: string;
  symbol: string;
  name: string;
  kind: 'stock' | 'etf' | 'fund' | 'bond' | 'other';
  accountName: string;
  /** The subaccount's currency, which paid for the shares */
  currency: string;
  /** Valued at IBKR's prices, as the price source doesn't know the security */
  isUnpriced: boolean;
  quantity: number;
  /** Per share, in the subaccount's currency */
  averageCost: number;
  /** In `priceCurrency` */
  lastPrice: number;
  priceCurrency: string;
  value: number;
  unrealizedGain: number;
  /** Since the previous close */
  dayChange: number;
  /** The closes of the last 30 days, oldest first */
  closes: number[];
}

/** Amounts are in the main currency */
export interface PortfolioSummary {
  mainCurrency: string;
  /** The cash and the holdings */
  totalValue: number;
  holdingsValue: number;
  /** Deposits minus withdrawals */
  netInvested: number;
  unrealizedGain: number;
  /** Of the last 12 months, after withholding tax */
  dividends: number;
  /** Of the holdings since the previous close */
  dayChange: number;
  /** The holdings and the cash, each with what it is grouped by */
  allocation: {
    account: string;
    currency: string;
    kind: Holding['kind'] | 'cash';
    value: number;
  }[];
}

/** The value and the net invested at a day's end, in the main currency */
export interface PortfolioHistoryPoint {
  date: string;
  value: number;
  netInvested: number;
}

export function summarizePortfolio({
  subaccounts,
  holdings,
  mainCurrency,
  mapper,
  now,
}: {
  subaccounts: BrokerSubaccount[];
  holdings: Holding[];
  mainCurrency: string;
  mapper: CurrencyMapper;
  now: Date;
}): PortfolioSummary {
  const yearAgo = subYears(now, 1);
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const inMain = (subaccount: BrokerSubaccount, amount: number) =>
    toMainCurrency({ amount, currency: subaccount.currency }, mapper);
  const sumEntries = (predicate: (entry: InvestmentEntry) => boolean) =>
    sum(
      subaccounts.map((subaccount) =>
        inMain(subaccount, sum(subaccount.entries.filter(predicate).map((entry) => entry.amount))),
      ),
    );

  return {
    mainCurrency,
    totalValue: sum(
      subaccounts.map((subaccount) => inMain(subaccount, subaccount.cash + subaccount.marketValue)),
    ),
    holdingsValue: sum(holdings.map((holding) => holding.value)),
    netInvested: sumEntries((entry) => entry.type === 'deposit' || entry.type === 'withdrawal'),
    unrealizedGain: sum(holdings.map((holding) => holding.unrealizedGain)),
    dividends: sumEntries(
      (entry) =>
        (entry.type === 'dividend' || entry.type === 'withholding_tax') &&
        entry.startedDate >= yearAgo,
    ),
    dayChange: sum(holdings.map((holding) => holding.dayChange)),
    allocation: [
      ...holdings.map((holding) => ({
        account: holding.accountName,
        currency: holding.currency,
        kind: holding.kind,
        value: holding.value,
      })),
      ...subaccounts.map((subaccount) => ({
        account: subaccount.accountName,
        currency: subaccount.currency,
        kind: 'cash' as const,
        value: inMain(subaccount, subaccount.cash),
      })),
    ],
  };
}

/**
 * The value and the net invested of the subaccounts at each day's end, from their first
 * transaction to `to`.
 *
 * @param days The sum of each subaccount's transactions per day, and of its deposits and
 * withdrawals
 */
export function toPortfolioHistory({
  subaccounts,
  days,
  valuations,
  mapper,
  to,
}: {
  subaccounts: Pick<BrokerSubaccount, 'id' | 'currency'>[];
  days: { subaccountId: string; date: string; amount: number; contributions: number }[];
  valuations: { subaccountId: string; date: string; marketValue: number }[];
  mapper: CurrencyMapper;
  to: string;
}): PortfolioHistoryPoint[] {
  const rates = Object.fromEntries(
    subaccounts.map((item) => [
      item.id,
      toMainCurrency({ amount: 1, currency: item.currency }, mapper),
    ]),
  );
  const daysByDate = groupBy(days, (item) => item.date);
  const valuationsByDate = groupBy(valuations, (item) => item.date);
  const cash: Record<string, number> = {};
  const marketValues: Record<string, number> = {};
  let netInvested = 0;
  const points: PortfolioHistoryPoint[] = [];

  const first = days.map((item) => item.date).toSorted()[0];
  for (let date = first; date && date <= to; date = nextDay(date)) {
    for (const item of daysByDate[date] ?? []) {
      cash[item.subaccountId] = (cash[item.subaccountId] ?? 0) + item.amount;
      netInvested += item.contributions * rates[item.subaccountId];
    }
    for (const item of valuationsByDate[date] ?? []) {
      marketValues[item.subaccountId] = item.marketValue;
    }
    points.push({
      date,
      value: subaccounts.reduce(
        (total, { id }) => total + ((cash[id] ?? 0) + (marketValues[id] ?? 0)) * rates[id],
        0,
      ),
      netInvested,
    });
  }

  return points;
}
