import { min } from 'date-fns';
import { and, asc, eq, gt, inArray, lt, ne, or, sql } from 'drizzle-orm';

import { reducePortfolio } from '@/lib/investments/portfolio';
import { fetchFxSeries } from '@/lib/market-data';
import { InvestmentEntry, InvestmentTrade, Position } from '@/lib/types/investments.types';
import { groupBy } from '@/lib/utils/group-by';
import { DbTx, getAdminDb, schema } from '@/server/db';

const ENTRY_KINDS = {
  buy: 'trade',
  sell: 'trade',
  split: 'trade',
  security_transfer: 'trade',
  deposit: 'cash',
  withdrawal: 'cash',
  dividend: 'cash',
  interest: 'cash',
  withholding_tax: 'cash',
  broker_fee: 'cash',
} satisfies Record<InvestmentEntry['type'], 'trade' | 'cash'>;

type TradeEntry = Extract<InvestmentEntry, { trade: InvestmentTrade }>;
type CashEntry = Exclude<InvestmentEntry, TradeEntry>;

/** A subaccount's holdings at a day's close, in its currency */
export interface DailyValuation {
  date: string;
  marketValue: number;
  costBasis: number;
}

export interface PriceClose {
  securityId: string;
  date: string;
  close: number;
  currency: string;
}

/** The cash of each subaccount at a month's end, by subaccount ID */
export interface MonthlyBalances {
  month: string;
  balances: Record<string, number>;
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
export const nextDay = (date: string) => toIsoDate(new Date(Date.parse(date) + 86_400_000));
const round = (value: number) => Number(value.toFixed(2));
const sumOf = (positions: Position[], value: (position: Position) => number) =>
  positions.reduce((total, position) => total + value(position), 0);

/**
 * Returns the subaccount's broker transactions. Other types, like exchanges and corrections, and
 * trade types without a trade row are left out.
 */
export async function getInvestmentEntries(
  tx: Pick<DbTx, 'select'>,
  subaccountId: string,
): Promise<InvestmentEntry[]> {
  const t = schema.transactions;
  const rows = await tx
    .select({
      type: t.type,
      amount: t.amount,
      startedDate: t.startedDate,
      sequence: t.sequence,
      trade: {
        securityId: schema.investmentTrades.securityId,
        quantity: schema.investmentTrades.quantity,
        price: schema.investmentTrades.price,
      },
    })
    .from(t)
    .leftJoin(schema.investmentTrades, eq(schema.investmentTrades.transactionId, t.id))
    .where(and(eq(t.subaccountId, subaccountId), inArray(t.type, Object.keys(ENTRY_KINDS))));

  return rows.flatMap(({ type, trade, ...row }): InvestmentEntry | [] => {
    const kind = ENTRY_KINDS[type as InvestmentEntry['type']];
    if (kind === 'trade') {
      return trade ? { ...row, subaccountId, type: type as TradeEntry['type'], trade } : [];
    }
    return { ...row, subaccountId, type: type as CashEntry['type'] };
  });
}

/**
 * Values the holdings at each day's close from the first trade to `to`, in the subaccount's
 * currency. A day without a close, like a holiday, keeps the last price. A security without a close
 * yet keeps the price of its last buy or sell.
 *
 * @param fx The rates from the subaccount's currency by date, for closes in other currencies
 */
export function valuePortfolio({
  entries,
  closes,
  currency,
  fx = {},
  to,
}: {
  entries: InvestmentEntry[];
  closes: PriceClose[];
  currency: string;
  fx?: Record<string, Record<string, number>>;
  to: string;
}): DailyValuation[] {
  const trades = entries
    .filter((entry) => 'trade' in entry)
    .toSorted(
      (a, b) => a.startedDate.getTime() - b.startedDate.getTime() || a.sequence - b.sequence,
    );
  if (!trades.length) {
    return [];
  }

  const closesByDate = groupBy(closes, (item) => item.date);
  const prices = new Map<string, number>();
  const rates: Record<string, number> = { [currency]: 1 };
  let positions: Position[] = [];
  let traded = 0;
  const valuations: DailyValuation[] = [];

  for (let date = toIsoDate(trades[0].startedDate); date <= to; date = nextDay(date)) {
    Object.assign(rates, fx[date]);

    const start = traded;
    while (traded < trades.length && toIsoDate(trades[traded].startedDate) <= date) {
      const { type, trade } = trades[traded++];
      if (type === 'buy' || type === 'sell') {
        prices.set(trade.securityId, trade.price);
      }
    }
    if (traded > start) {
      positions = reducePortfolio(trades.slice(0, traded)).positions;
    }

    for (const item of closesByDate[date] ?? []) {
      const rate = rates[item.currency];
      if (rate) {
        prices.set(item.securityId, item.close / rate);
      }
    }

    valuations.push({
      date,
      marketValue: round(
        sumOf(positions, (item) => item.quantity * (prices.get(item.securityId) ?? 0)),
      ),
      costBasis: round(sumOf(positions, (item) => item.costBasis)),
    });
  }

  return valuations;
}

/**
 * Adds each subaccount's market value at the month's end, its last valuation on or before it, to
 * its cash.
 */
export function addMarketValue(
  monthly: MonthlyBalances[],
  valuations: { subaccountId: string; date: string; marketValue: number }[],
): MonthlyBalances[] {
  const sorted = valuations.toSorted((a, b) => a.date.localeCompare(b.date));
  const marketValues: Record<string, number> = {};
  let next = 0;

  return monthly.map(({ month, balances }) => {
    while (next < sorted.length && sorted[next].date.slice(0, 7) <= month) {
      marketValues[sorted[next].subaccountId] = sorted[next].marketValue;
      next++;
    }
    const withMarketValue = { ...balances };
    for (const [subaccountId, marketValue] of Object.entries(marketValues)) {
      withMarketValue[subaccountId] = (withMarketValue[subaccountId] ?? 0) + marketValue;
    }
    return { month, balances: withMarketValue };
  });
}

/**
 * Rebuilds the subaccount's daily valuations from its first trade to today. Runs without a user
 * session, through the admin client. Running it again gives the same rows.
 */
export async function revalueSubaccount(subaccountId: string) {
  const { admin } = await getAdminDb();
  const [subaccount] = await admin
    .select({ currency: schema.subaccounts.currency, userId: schema.accounts.userId })
    .from(schema.subaccounts)
    .innerJoin(schema.accounts, eq(schema.accounts.id, schema.subaccounts.accountId))
    .where(eq(schema.subaccounts.id, subaccountId));
  const entries = await getInvestmentEntries(admin, subaccountId);
  const securityIds = [
    ...new Set(entries.flatMap((entry) => ('trade' in entry ? entry.trade.securityId : []))),
  ];

  const p = schema.securityPrices;
  const closes = securityIds.length
    ? await admin
        .select({ securityId: p.securityId, date: p.date, close: p.close, currency: p.currency })
        .from(p)
        .innerJoin(schema.securities, eq(schema.securities.id, p.securityId))
        .where(
          and(
            inArray(p.securityId, securityIds),
            // Unpriced securities are valued at the broker's prices only
            or(eq(schema.securities.priceStatus, 'priced'), ne(p.source, 'yahoo')),
          ),
        )
        .orderBy(asc(p.date))
    : [];
  const foreignCurrencies = [
    ...new Set(closes.map((item) => item.currency).filter((item) => item !== subaccount.currency)),
  ];
  const fx = foreignCurrencies.length
    ? await fetchFxSeries(
        subaccount.currency,
        foreignCurrencies,
        min(entries.map((entry) => entry.startedDate)),
      )
    : undefined;

  const valuations = valuePortfolio({
    entries,
    closes,
    currency: subaccount.currency,
    fx,
    to: toIsoDate(new Date()),
  });

  const v = schema.portfolioValuations;
  await admin.transaction(async (tx) => {
    await tx
      .delete(v)
      .where(
        and(
          eq(v.subaccountId, subaccountId),
          valuations.length
            ? or(lt(v.date, valuations[0].date), gt(v.date, valuations.at(-1)!.date))
            : undefined,
        ),
      );
    if (valuations.length) {
      await tx
        .insert(v)
        .values(valuations.map((item) => ({ ...item, subaccountId, userId: subaccount.userId })))
        .onConflictDoUpdate({
          target: [v.subaccountId, v.date],
          set: {
            marketValue: sql`excluded.market_value`,
            costBasis: sql`excluded.cost_basis`,
          },
        });
    }
  });
}
