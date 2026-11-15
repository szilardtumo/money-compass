import 'server-only';

import { max, min } from 'date-fns';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';

import { decryptSecret } from '@/lib/crypto';
import { fetchFlexStatement, FlexSecurity, FlexStatement, IbkrFlexError } from '@/lib/ibkr-flex';
import { reducePortfolio } from '@/lib/investments/portfolio';
import { getAdminDb, schema } from '@/server/db';

import type { ProviderEntry } from '../providers';
import { insertBalanceCorrection, linkTransactions } from '../sync';

export interface IbkrCredentials {
  token: string;
  queryId: string;
}

// IBKR serves at most 365 days per statement
const WINDOW_DAYS = 365;
// A window takes at least 12 seconds, because IBKR allows 10 requests a minute
const MAX_WINDOWS_PER_SYNC = 4;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

/** One integration account per IBKR account and currency */
export const getIbkrIdentificationHash = (accountId: string, currency: string) =>
  createHash('sha256').update(`${accountId}:${currency}`).digest('hex');

const getSecurityKey = (security: Pick<FlexSecurity, 'isin' | 'symbol' | 'exchange'>) =>
  security.isin ?? `${security.symbol}:${security.exchange}`;

/**
 * Saves the securities to the shared market data and returns their IDs by key. A security keeps
 * the listing it was first saved with, even if another account trades it on another exchange.
 */
async function upsertSecurities(securities: FlexSecurity[]) {
  const unique = [...new Map(securities.map((item) => [getSecurityKey(item), item])).values()];
  const withIsin = unique.filter((item) => item.isin);
  const withoutIsin = unique.filter((item) => !item.isin);
  const { admin } = await getAdminDb();

  // The updates change nothing, so the existing rows are returned too
  const rows = [
    ...(withIsin.length
      ? await admin
          .insert(schema.securities)
          .values(withIsin)
          .onConflictDoUpdate({
            target: schema.securities.isin,
            set: { isin: sql`excluded.isin` },
          })
          .returning()
      : []),
    ...(withoutIsin.length
      ? await admin
          .insert(schema.securities)
          .values(withoutIsin)
          .onConflictDoUpdate({
            target: [schema.securities.symbol, schema.securities.exchange],
            targetWhere: sql`${schema.securities.isin} is null`,
            set: { symbol: sql`excluded.symbol` },
          })
          .returning()
      : []),
  ];

  return new Map(rows.map((row) => [getSecurityKey(row), row.id]));
}

/** Compares the positions from the subaccount's trades with IBKR's open positions */
function findPositionMismatches(
  local: { securityId: string; symbol: string; quantity: number }[],
  ibkr: { securityId: string; symbol: string; quantity: number }[],
) {
  const quantities = new Map<string, { symbol: string; local: number; ibkr: number }>();
  for (const item of local) {
    quantities.set(item.securityId, { symbol: item.symbol, local: item.quantity, ibkr: 0 });
  }
  for (const item of ibkr) {
    const entry = quantities.get(item.securityId) ?? { symbol: item.symbol, local: 0, ibkr: 0 };
    quantities.set(item.securityId, { ...entry, ibkr: item.quantity });
  }

  return [...quantities.values()]
    .filter((item) => Math.abs(item.local - item.ibkr) > 1e-6)
    .map((item) => `${item.symbol} has ${item.local} here and ${item.ibkr} at IBKR`);
}

export const ibkrFlexProvider = {
  label: 'Interactive Brokers',
  // A first sync takes up to 4 statements, and IBKR allows 10 requests a minute
  dailySyncLimit: 3,
  // A new token takes a few steps in IBKR's Client Portal
  expiryWarningDays: 14,
  isRevokedError: (error) => error instanceof IbkrFlexError && error.revoked,

  /**
   * Imports the IBKR activity in the account's currency as transactions, with a trade row for each
   * buy, sell, split and security transfer. The first sync after linking walks back to the account's
   * opening in 365-day windows, a few per sync, and later syncs continue it. Every sync also fetches
   * the days since the last one. A correction sets the cash to IBKR's, and once the history is
   * complete, the positions are compared with IBKR's.
   */
  sync: async (account) => {
    if (!account.integration.credentials) {
      throw new Error('The IBKR integration has no credentials.');
    }
    const { token, queryId } = JSON.parse(
      decryptSecret(account.integration.credentials),
    ) as IbkrCredentials;
    const fetchStatement = async (from: Date, to: Date) => {
      const statement = (await fetchFlexStatement(token, queryId, { from, to })).find(
        (item) => item.accountId === account.externalId,
      );
      if (!statement) {
        throw new Error(`The IBKR statement has no account ${account.externalId}.`);
      }
      return statement;
    };

    const today = new Date(toIsoDate(new Date()));
    const statements: FlexStatement[] = [];
    let syncedFrom = account.syncedFrom ? new Date(account.syncedFrom) : null;
    if (syncedFrom) {
      const lastSyncedDay = new Date(toIsoDate(account.lastSyncedAt ?? today));
      statements.push(
        await fetchStatement(
          max([addDays(today, 1 - WINDOW_DAYS), addDays(lastSyncedDay, -7)]),
          today,
        ),
      );
    }
    while (
      statements.length < MAX_WINDOWS_PER_SYNC &&
      !(syncedFrom && statements.length && syncedFrom <= statements[0].dateOpened)
    ) {
      const to = syncedFrom ? addDays(syncedFrom, -1) : today;
      syncedFrom = addDays(to, 1 - WINDOW_DAYS);
      statements.push(await fetchStatement(syncedFrom, to));
    }

    const [latest] = statements;
    const isComplete = syncedFrom! <= latest.dateOpened;
    const entries = [
      ...new Map(
        statements
          .flatMap((item) => item.entries)
          .map((entry) => [entry.externalRef + entry.currency, entry]),
      ).values(),
    ];
    const ownEntries = entries.filter((entry) => entry.currency === account.currency);
    const positions = latest.positions.filter(
      (item) => item.security.currency === account.currency,
    );

    const securityIds = await upsertSecurities([
      ...ownEntries.flatMap((entry) => entry.trade?.security ?? []),
      ...positions.map((item) => item.security),
    ]);
    if (positions.length) {
      const { admin } = await getAdminDb();
      await admin
        .insert(schema.securityPrices)
        .values(
          positions.map((item) => ({
            securityId: securityIds.get(getSecurityKey(item.security))!,
            date: item.date,
            close: item.markPrice,
            currency: item.security.currency,
            source: 'ibkr' as const,
          })),
        )
        .onConflictDoNothing();
    }

    return async (tx) => {
      const { subaccountId, userId } = account;
      const warnings: string[] = [];

      const siblings = await tx
        .select({
          currency: schema.integrationAccounts.currency,
          subaccountId: schema.integrationAccounts.subaccountId,
        })
        .from(schema.integrationAccounts)
        .where(
          and(
            eq(schema.integrationAccounts.integrationId, account.integrationId),
            eq(schema.integrationAccounts.externalId, account.externalId),
          ),
        );
      const linkedCurrencies = new Set(
        siblings.flatMap((item) => (item.subaccountId ? item.currency : [])),
      );
      const skipped = Map.groupBy(
        entries.filter((entry) => !linkedCurrencies.has(entry.currency)),
        (entry) => entry.currency,
      );
      skipped.forEach((items, currency) =>
        warnings.push(
          `Skipped ${items.length} IBKR rows in ${currency.toUpperCase()}, which isn't linked to a subaccount.`,
        ),
      );
      const unsupportedCount = statements.reduce((sum, item) => sum + item.unsupportedCount, 0);
      if (unsupportedCount) {
        warnings.push(`Skipped ${unsupportedCount} IBKR rows of unsupported types.`);
      }

      const refs = ownEntries.map((entry) => entry.externalRef);
      const known = new Set(
        refs.length
          ? (
              await tx
                .select({ externalRef: schema.transactions.externalRef })
                .from(schema.transactions)
                .where(
                  and(
                    eq(schema.transactions.subaccountId, subaccountId),
                    inArray(schema.transactions.externalRef, refs),
                  ),
                )
            ).map((row) => row.externalRef)
          : [],
      );
      const imported = ownEntries.filter((entry) => !known.has(entry.externalRef));

      const correctionAmount = await insertBalanceCorrection(tx, {
        subaccountId,
        userId,
        target: latest.endingCash[account.currency] ?? 0,
        pending: imported.reduce((sum, entry) => sum + entry.amount, 0),
        date: imported.length ? min(imported.map((entry) => entry.date)) : new Date(),
        description: 'Balance correction from IBKR sync',
      });

      if (imported.length) {
        const inserted = await tx
          .insert(schema.transactions)
          .values(
            imported.map((entry) => ({
              externalRef: entry.externalRef,
              amount: entry.amount,
              startedDate: entry.date,
              completedDate: entry.date,
              description: entry.description,
              type: entry.type,
              bankData: entry.isin ? { isin: entry.isin } : null,
              dataSource: 'integration' as const,
              subaccountId,
              userId,
            })),
          )
          .onConflictDoNothing()
          .returning({ id: schema.transactions.id, externalRef: schema.transactions.externalRef });

        const tradeByRef = new Map(imported.map((entry) => [entry.externalRef, entry.trade]));
        const trades = inserted.flatMap(({ id, externalRef }) => {
          const trade = tradeByRef.get(externalRef!);
          return trade
            ? {
                transactionId: id,
                userId,
                securityId: securityIds.get(getSecurityKey(trade.security))!,
                quantity: trade.quantity,
                price: trade.price,
              }
            : [];
        });
        if (trades.length) {
          await tx.insert(schema.investmentTrades).values(trades);
        }
      }

      await tx
        .update(schema.integrationAccounts)
        .set({ syncedFrom: toIsoDate(syncedFrom!) })
        .where(eq(schema.integrationAccounts.id, account.id));
      await linkTransactions(tx, userId);

      if (isComplete) {
        const rows = await tx
          .select({
            type: schema.transactions.type,
            amount: schema.transactions.amount,
            startedDate: schema.transactions.startedDate,
            sequence: schema.transactions.sequence,
            securityId: schema.investmentTrades.securityId,
            quantity: schema.investmentTrades.quantity,
            price: schema.investmentTrades.price,
            symbol: schema.securities.symbol,
          })
          .from(schema.transactions)
          .innerJoin(
            schema.investmentTrades,
            eq(schema.investmentTrades.transactionId, schema.transactions.id),
          )
          .innerJoin(
            schema.securities,
            eq(schema.securities.id, schema.investmentTrades.securityId),
          )
          .where(eq(schema.transactions.subaccountId, subaccountId));
        const symbols = new Map(rows.map((row) => [row.securityId, row.symbol]));
        const { positions: local } = reducePortfolio(
          rows.map((row) => ({
            subaccountId,
            // Only these types have trade rows
            type: row.type as 'buy' | 'sell' | 'split' | 'security_transfer',
            amount: row.amount,
            startedDate: row.startedDate,
            sequence: row.sequence,
            trade: { securityId: row.securityId, quantity: row.quantity, price: row.price },
          })),
        );

        const mismatches = findPositionMismatches(
          local.map((item) => ({ ...item, symbol: symbols.get(item.securityId)! })),
          positions.map((item) => ({
            securityId: securityIds.get(getSecurityKey(item.security))!,
            symbol: item.security.symbol,
            quantity: item.quantity,
          })),
        );
        if (mismatches.length) {
          warnings.push(`Reconciliation: ${mismatches.join('; ')}.`);
        }
      }

      return {
        importedCount: imported.length,
        correctionAmount,
        warning: warnings.join(' ') || null,
      };
    };
  },
} satisfies ProviderEntry;
