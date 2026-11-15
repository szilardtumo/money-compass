import 'server-only';

import { subDays } from 'date-fns';
import { and, asc, eq, gte, inArray, ne, or, sql, sum } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { reducePortfolio } from '@/lib/investments/portfolio';
import { toMainCurrency } from '@/lib/utils/currencies';
import { formatUtcDay } from '@/lib/utils/formatters';
import { groupBy } from '@/lib/utils/group-by';
import { schema } from '@/server/db';

import {
  BrokerSubaccount,
  Holding,
  PortfolioHistoryPoint,
  PortfolioSummary,
  summarizePortfolio,
  toPortfolioHistory,
} from './overview';
import { getInvestmentEntries } from './valuation';
import { getAccounts } from '../accounts/queries';
import { getMainCurrencyWithMapper } from '../currencies/queries';

/**
 * Returns the subaccounts of the investment accounts that have broker transactions, with those
 * transactions.
 */
const getBrokerSubaccounts = createApiQuery<void, BrokerSubaccount[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const subaccounts = (await getAccounts())
    .filter((account) => account.category === 'investment')
    .flatMap((account) => account.subaccounts.map((subaccount) => ({ account, subaccount })));
  const entries = await db.rls((tx) =>
    Promise.all(subaccounts.map(({ subaccount }) => getInvestmentEntries(tx, subaccount.id))),
  );
  const brokerAccountIds = new Set(
    subaccounts.flatMap(({ account }, index) => (entries[index].length ? account.id : [])),
  );

  return subaccounts.flatMap(({ account, subaccount }, index) =>
    brokerAccountIds.has(account.id)
      ? {
          id: subaccount.id,
          accountName: account.name,
          currency: subaccount.originalCurrency,
          cash: subaccount.cash,
          marketValue: subaccount.balance.originalValue - subaccount.cash,
          entries: entries[index],
        }
      : [],
  );
});

/**
 * Returns the open positions valued at their last close, with their average cost.
 */
export const getHoldings = createApiQuery<void, Holding[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const [subaccounts, { mapper }] = await Promise.all([
    getBrokerSubaccounts(),
    getMainCurrencyWithMapper(),
  ]);
  const positions = subaccounts.flatMap((subaccount) =>
    reducePortfolio(subaccount.entries)
      // Float sums of fractional shares can leave dust after a full sell
      .positions.filter((position) => Math.abs(position.quantity) > 1e-9)
      .map((position) => ({ ...position, subaccount })),
  );
  const securityIds = [...new Set(positions.map((position) => position.securityId))];
  if (!securityIds.length) {
    return [];
  }

  const s = schema.securities;
  const p = schema.securityPrices;
  const [securities, closes] = await db.rls((tx) =>
    Promise.all([
      tx.select().from(s).where(inArray(s.id, securityIds)),
      tx
        .select({ securityId: p.securityId, close: p.close, currency: p.currency })
        .from(p)
        .innerJoin(s, eq(s.id, p.securityId))
        .where(
          and(
            inArray(p.securityId, securityIds),
            gte(p.date, formatUtcDay(subDays(new Date(), 30))),
            // Like the valuation, unpriced securities count only the broker's prices
            or(eq(s.priceStatus, 'priced'), ne(p.source, 'yahoo')),
          ),
        )
        .orderBy(asc(p.date)),
    ]),
  );
  const securitiesById = new Map(securities.map((security) => [security.id, security]));
  const closesBySecurity = groupBy(closes, (item) => item.securityId);

  return positions.map(({ subaccount, securityId, quantity, costBasis }) => {
    const security = securitiesById.get(securityId)!;
    const securityCloses = closesBySecurity[securityId] ?? [];
    const averageCost = costBasis / quantity;
    const [previous, last] = securityCloses.slice(-2).map((item) => item.close);
    const lastPrice = last ?? previous ?? averageCost;
    const priceCurrency = securityCloses.at(-1)?.currency ?? subaccount.currency;
    const inMain = (amount: number) => toMainCurrency({ amount, currency: priceCurrency }, mapper);
    const value = inMain(quantity * lastPrice);

    return {
      subaccountId: subaccount.id,
      securityId,
      symbol: security.symbol,
      name: security.name,
      kind: security.kind,
      accountName: subaccount.accountName,
      currency: subaccount.currency,
      isUnpriced: security.priceStatus === 'unpriced',
      quantity,
      averageCost,
      lastPrice,
      priceCurrency,
      value,
      unrealizedGain:
        value - toMainCurrency({ amount: costBasis, currency: subaccount.currency }, mapper),
      dayChange: last === undefined ? 0 : inMain(quantity * (last - previous)),
      closes: securityCloses.map((item) => item.close),
    };
  });
});

/**
 * Returns the totals of the broker accounts, or null without one.
 */
export const getPortfolioSummary = createApiQuery<void, PortfolioSummary | null>(async () => {
  'use cache: private';
  const [subaccounts, holdings, { mainCurrency, mapper }] = await Promise.all([
    getBrokerSubaccounts(),
    getHoldings(),
    getMainCurrencyWithMapper(),
  ]);

  return subaccounts.length
    ? summarizePortfolio({ subaccounts, holdings, mainCurrency, mapper, now: new Date() })
    : null;
});

/**
 * Returns the daily value and net invested of the broker accounts, from their first transaction.
 */
export const getPortfolioHistory = createApiQuery<void, PortfolioHistoryPoint[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const [subaccounts, { mapper }] = await Promise.all([
    getBrokerSubaccounts(),
    getMainCurrencyWithMapper(),
  ]);
  const ids = subaccounts.map((subaccount) => subaccount.id);
  if (!ids.length) {
    return [];
  }

  const t = schema.transactions;
  const v = schema.portfolioValuations;
  const [days, valuations] = await db.rls((tx) =>
    Promise.all([
      tx
        .select({
          subaccountId: t.subaccountId,
          date: sql<string>`to_char(${t.startedDate} at time zone 'UTC', 'YYYY-MM-DD')`.as('date'),
          amount: sum(t.amount).mapWith(Number),
          contributions:
            sql`coalesce(sum(${t.amount}) filter (where ${inArray(t.type, ['deposit', 'withdrawal'])}), 0)`.mapWith(
              Number,
            ),
        })
        .from(t)
        .where(inArray(t.subaccountId, ids))
        .groupBy(t.subaccountId, sql`date`),
      tx
        .select({ subaccountId: v.subaccountId, date: v.date, marketValue: v.marketValue })
        .from(v)
        .where(inArray(v.subaccountId, ids)),
    ]),
  );

  return toPortfolioHistory({
    subaccounts,
    days,
    valuations,
    mapper,
    to: formatUtcDay(new Date()),
  });
});
