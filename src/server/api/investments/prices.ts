import 'server-only';

import { min, subDays } from 'date-fns';
import { and, eq, max, sql, sum } from 'drizzle-orm';

import { fetchDailyCloses, toQuoteSymbol } from '@/lib/market-data';
import { getAdminDb, schema } from '@/server/db';

/**
 * Saves Yahoo's daily closes of the traded securities. A security without Yahoo prices gets its
 * history since its first trade. A held one gets the last 7 days, or the days since its last price
 * when that is older. A security Yahoo doesn't know is marked unpriced. A failed fetch writes
 * nothing for its security.
 *
 * @returns The number of securities whose fetch failed
 */
export async function updateSecurityPrices() {
  const { admin } = await getAdminDb();
  const t = schema.transactions;
  const trades = schema.investmentTrades;
  const prices = schema.securityPrices;

  const positions = admin
    .select({
      securityId: trades.securityId,
      quantity: sum(trades.quantity).mapWith(Number).as('quantity'),
      firstTradeDate: sql<Date>`min(${t.startedDate})`.as('first_trade_date'),
    })
    .from(trades)
    .innerJoin(t, eq(t.id, trades.transactionId))
    .groupBy(trades.securityId, t.subaccountId)
    .as('positions');
  const securities = await admin
    .select({
      id: schema.securities.id,
      symbol: schema.securities.symbol,
      exchange: schema.securities.exchange,
      quoteSymbol: schema.securities.quoteSymbol,
      firstTradeDate: sql`min(${positions.firstTradeDate})`.mapWith(t.startedDate),
      isHeld: sql<boolean>`bool_or(${positions.quantity} <> 0)`,
      lastPriceDate: max(prices.date),
    })
    .from(schema.securities)
    .innerJoin(positions, eq(positions.securityId, schema.securities.id))
    .leftJoin(prices, and(eq(prices.securityId, schema.securities.id), eq(prices.source, 'yahoo')))
    .groupBy(schema.securities.id);

  let failed = 0;
  const weekAgo = subDays(new Date(), 7);
  for (const security of securities) {
    if (security.lastPriceDate && !security.isHeld) {
      continue;
    }
    const quoteSymbol = security.quoteSymbol ?? toQuoteSymbol(security.symbol, security.exchange);
    const from = security.lastPriceDate
      ? min([new Date(security.lastPriceDate), weekAgo])
      : security.firstTradeDate;

    try {
      const closes = quoteSymbol ? await fetchDailyCloses(quoteSymbol, from) : null;
      if (closes?.length) {
        await admin
          .insert(prices)
          .values(
            closes.map((item) => ({ ...item, securityId: security.id, source: 'yahoo' as const })),
          )
          .onConflictDoUpdate({
            target: [prices.securityId, prices.date],
            set: { close: sql`excluded.close`, currency: sql`excluded.currency` },
            // The broker's own prices stay
            setWhere: eq(prices.source, 'yahoo'),
          });
      }
      await admin
        .update(schema.securities)
        .set({ quoteSymbol, priceStatus: closes ? 'priced' : 'unpriced' })
        .where(eq(schema.securities.id, security.id));
    } catch (error) {
      failed++;
      console.error(`Price update error for ${quoteSymbol}:`, error);
    }
  }

  return failed;
}
