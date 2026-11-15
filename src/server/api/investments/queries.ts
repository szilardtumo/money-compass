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
  DividendPayment,
  DividendSummary,
  getReturns,
  groupDividends,
  Holding,
  HoldingDetail,
  isPaymentOf,
  PortfolioHistoryPoint,
  PortfolioReturns,
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
          accountId: account.id,
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
 * Returns the sum of each broker subaccount's transactions per day, and of its deposits and
 * withdrawals, with its daily valuations.
 */
const getDailyRows = createApiQuery<
  void,
  Pick<Parameters<typeof toPortfolioHistory>[0], 'days' | 'valuations'>
>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const ids = (await getBrokerSubaccounts()).map((subaccount) => subaccount.id);
  if (!ids.length) {
    return { days: [], valuations: [] };
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

  return { days, valuations };
});

/**
 * Returns the daily value and net invested of the broker accounts, from their first transaction.
 */
export const getPortfolioHistory = createApiQuery<void, PortfolioHistoryPoint[]>(async () => {
  'use cache: private';
  const [subaccounts, rows, { mapper }] = await Promise.all([
    getBrokerSubaccounts(),
    getDailyRows(),
    getMainCurrencyWithMapper(),
  ]);

  return toPortfolioHistory({ subaccounts, ...rows, mapper, to: formatUtcDay(new Date()) });
});

/**
 * Returns the money-weighted return of each broker account and of all of them, over the last year,
 * this year and all time.
 */
export const getPortfolioReturns = createApiQuery<void, PortfolioReturns>(async () => {
  'use cache: private';
  const [subaccounts, history, { days, valuations }, { mapper }] = await Promise.all([
    getBrokerSubaccounts(),
    getPortfolioHistory(),
    getDailyRows(),
    getMainCurrencyWithMapper(),
  ]);
  const now = new Date();

  return {
    total: getReturns(history, now),
    accounts: Object.values(groupBy(subaccounts, (subaccount) => subaccount.accountId)).map(
      (accountSubaccounts) => {
        const ids = new Set(accountSubaccounts.map((subaccount) => subaccount.id));
        const accountHistory = toPortfolioHistory({
          subaccounts: accountSubaccounts,
          days: days.filter((item) => ids.has(item.subaccountId)),
          valuations: valuations.filter((item) => ids.has(item.subaccountId)),
          mapper,
          to: formatUtcDay(now),
        });
        return {
          id: accountSubaccounts[0].accountId,
          name: accountSubaccounts[0].accountName,
          returns: getReturns(accountHistory, now),
        };
      },
    ),
  };
});

/**
 * Returns the dividends and withholding taxes of the broker accounts.
 */
const getDividendPayments = createApiQuery<void, DividendPayment[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const [subaccounts, { mapper }] = await Promise.all([
    getBrokerSubaccounts(),
    getMainCurrencyWithMapper(),
  ]);
  const currencies = new Map(subaccounts.map((subaccount) => [subaccount.id, subaccount.currency]));
  if (!currencies.size) {
    return [];
  }

  const t = schema.transactions;
  const rows = await db.rls((tx) =>
    tx
      .select({
        transactionId: t.id,
        subaccountId: t.subaccountId,
        date: t.startedDate,
        amount: t.amount,
        isin: sql<string | null>`${t.bankData}->>'isin'`,
      })
      .from(t)
      .where(
        and(
          inArray(t.subaccountId, [...currencies.keys()]),
          inArray(t.type, ['dividend', 'withholding_tax']),
        ),
      ),
  );

  return rows.map((row) => ({
    ...row,
    amount: toMainCurrency(
      { amount: row.amount, currency: currencies.get(row.subaccountId)! },
      mapper,
    ),
  }));
});

/**
 * Returns the dividends after withholding tax by month and by security.
 */
export const getDividends = createApiQuery<void, DividendSummary>(async () => {
  'use cache: private';
  const { db } = await createApiContext();
  const [subaccounts, payments] = await Promise.all([
    getBrokerSubaccounts(),
    getDividendPayments(),
  ]);
  const securityIds = [
    ...new Set(
      subaccounts.flatMap((subaccount) =>
        subaccount.entries.flatMap((entry) => ('trade' in entry ? entry.trade.securityId : [])),
      ),
    ),
  ];
  const s = schema.securities;
  const securities = securityIds.length
    ? await db.rls((tx) =>
        tx
          .select({ id: s.id, symbol: s.symbol, name: s.name, isin: s.isin })
          .from(s)
          .where(inArray(s.id, securityIds)),
      )
    : [];

  return groupDividends({ payments, securities, now: new Date() });
});

/**
 * Returns a security's position, open or sold, with its trades and prices, or null when the broker
 * accounts never traded it.
 */
export const getHoldingDetail = createApiQuery<string, HoldingDetail | null>(
  async ({ input: securityId }) => {
    'use cache: private';
    const { db } = await createApiContext();
    const s = schema.securities;
    const p = schema.securityPrices;
    const t = schema.transactions;
    const it = schema.investmentTrades;
    const [subaccounts, holdings, payments, { mapper }, [[security], trades, prices]] =
      await Promise.all([
        getBrokerSubaccounts(),
        getHoldings(),
        getDividendPayments(),
        getMainCurrencyWithMapper(),
        db.rls((tx) =>
          Promise.all([
            tx.select().from(s).where(eq(s.id, securityId)),
            tx
              .select({
                transactionId: t.id,
                subaccountId: t.subaccountId,
                type: t.type,
                date: t.startedDate,
                quantity: it.quantity,
                price: it.price,
              })
              .from(it)
              .innerJoin(t, eq(t.id, it.transactionId))
              .where(eq(it.securityId, securityId))
              .orderBy(asc(t.startedDate)),
            tx
              .select({ date: p.date, close: p.close, currency: p.currency })
              .from(p)
              .innerJoin(s, eq(s.id, p.securityId))
              .where(
                and(
                  eq(p.securityId, securityId),
                  // Like the valuation, unpriced securities count only the broker's prices
                  or(eq(s.priceStatus, 'priced'), ne(p.source, 'yahoo')),
                ),
              )
              .orderBy(asc(p.date)),
          ]),
        ),
      ]);
    const positions = subaccounts.flatMap((subaccount) =>
      reducePortfolio(subaccount.entries)
        .positions.filter((position) => position.securityId === securityId)
        .map((position) => ({ ...position, subaccount })),
    );
    if (!security || !positions.length) {
      return null;
    }

    const sumOf = (values: number[]) => values.reduce((total, value) => total + value, 0);
    const held = holdings.filter((holding) => holding.securityId === securityId);
    const quantity = sumOf(held.map((holding) => holding.quantity));
    const dividends = payments.filter((payment) => isPaymentOf(payment, security));
    const subaccountIds = [...new Set([...trades, ...dividends].map((item) => item.subaccountId))];
    const firstTrade = formatUtcDay(trades[0].date);

    return {
      securityId,
      symbol: security.symbol,
      name: security.name,
      isUnpriced: security.priceStatus === 'unpriced',
      accountNames: [
        ...new Set(
          subaccounts
            .filter((subaccount) => subaccountIds.includes(subaccount.id))
            .map((subaccount) => subaccount.accountName),
        ),
      ],
      currency: positions[0].subaccount.currency,
      quantity,
      averageCost: held.length
        ? sumOf(held.map((holding) => holding.averageCost * holding.quantity)) / quantity
        : null,
      value: sumOf(held.map((holding) => holding.value)),
      unrealizedGain: sumOf(held.map((holding) => holding.unrealizedGain)),
      realizedGain: sumOf(
        positions.map((position) =>
          toMainCurrency(
            { amount: position.realizedGain, currency: position.subaccount.currency },
            mapper,
          ),
        ),
      ),
      dividends: sumOf(dividends.map((payment) => payment.amount)),
      prices: prices
        .filter((price) => price.date >= firstTrade)
        .map(({ date, close }) => ({ date, close })),
      priceCurrency: prices.at(-1)?.currency ?? positions[0].subaccount.currency,
      trades: trades.flatMap((trade) =>
        trade.type === 'buy' || trade.type === 'sell'
          ? {
              date: formatUtcDay(trade.date),
              type: trade.type,
              quantity: Math.abs(trade.quantity),
              price: trade.price,
            }
          : [],
      ),
      subaccountIds,
      transactionIds: [...trades, ...dividends].map((item) => item.transactionId),
    };
  },
);
