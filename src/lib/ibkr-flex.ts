import { XMLParser } from 'fast-xml-parser';

import { env } from '@/lib/env';
import { InvestmentEntry } from '@/lib/types/investments.types';

// https://www.interactivebrokers.com/campus/ibkr-api-page/flex-web-service/
const DEFAULT_BASE_URL = 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService';
// The "please try again shortly" errors. 1019 means the statement is still being generated.
const RETRY_CODES = [
  '1001',
  '1004',
  '1005',
  '1006',
  '1007',
  '1008',
  '1009',
  '1018',
  '1019',
  '1021',
];
// The token expired or is invalid, the IP is restricted, or the query is invalid
const REVOKED_CODES = ['1012', '1013', '1014', '1015'];
const TIMEOUT_MS = 60_000;
// IBKR allows 10 requests a minute per token, so requests, polls included, are 6 seconds apart
const REQUEST_INTERVAL_MS = 6_000;

const ROW_ELEMENTS = new Set([
  'FlexStatement',
  'CashReportCurrency',
  'OpenPosition',
  'Trade',
  'CashTransaction',
  'CorporateAction',
  'SecurityInfo',
]);
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  isArray: (name) => ROW_ELEMENTS.has(name),
});

const CASH_TYPES: Record<string, FlexEntry['type']> = {
  dividends: 'dividend',
  'payment in lieu of dividends': 'dividend',
  'withholding tax': 'withholding_tax',
  'broker interest received': 'interest',
  'broker interest paid': 'interest',
  'bond interest received': 'interest',
  'bond interest paid': 'interest',
  'other fees': 'broker_fee',
  'commission adjustments': 'broker_fee',
  'advisor fees': 'broker_fee',
};

export class IbkrFlexError extends Error {
  /** The token or the query no longer works, so syncing needs new ones */
  readonly revoked: boolean;

  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'IbkrFlexError';
    this.revoked = REVOKED_CODES.includes(code ?? '');
  }
}

export interface FlexSecurity {
  isin: string | null;
  symbol: string;
  exchange: string;
  name: string;
  currency: string;
  kind: 'stock' | 'etf' | 'fund';
}

/** A Flex row as a transaction on the subaccount of its currency */
export interface FlexEntry {
  externalRef: string;
  currency: string;
  type: InvestmentEntry['type'] | 'exchange';
  amount: number;
  date: Date;
  description: string;
  trade: { security: FlexSecurity; quantity: number; price: number } | null;
}

export interface FlexStatement {
  accountId: string;
  dateOpened: Date;
  /** Cash at the end of the period by currency */
  endingCash: Record<string, number>;
  positions: { security: FlexSecurity; quantity: number; markPrice: number; date: string }[];
  entries: FlexEntry[];
  /** Rows the mapping leaves out, like option trades */
  unsupportedCount: number;
}

type Row = Record<string, string>;

/** Dates of the Flex formats yyyyMMdd and yyyy-MM-dd, optionally with a time after ";" */
function toDate(value: string) {
  const digits = value.split(/[;, ]/)[0].replaceAll('-', '');
  return new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
}

function readStatement(statement: Record<string, unknown>): FlexStatement {
  const rows = (section: string, row: string) =>
    (statement[section] as Record<string, Row[]> | undefined)?.[row] ?? [];
  const isSecurity = (row: Row) => row.assetCategory === 'STK' || row.assetCategory === 'FUND';

  const account = statement.AccountInformation as Row | undefined;
  if (!account?.dateOpened) {
    throw new IbkrFlexError(
      'The Flex query needs the Account Information section with the Date Opened field.',
    );
  }

  const infoByConid = new Map(
    rows('SecuritiesInfo', 'SecurityInfo').map((row) => [row.conid, row]),
  );
  const toSecurity = (row: Row): FlexSecurity => {
    const info = { ...row, ...infoByConid.get(row.conid) };
    return {
      isin: info.isin || (info.securityIDType === 'ISIN' && info.securityID) || null,
      symbol: info.symbol,
      exchange: info.listingExchange ?? '',
      name: info.description || info.symbol,
      currency: info.currency.toLowerCase(),
      kind: info.assetCategory === 'FUND' ? 'fund' : info.subCategory === 'ETF' ? 'etf' : 'stock',
    };
  };

  const entries: FlexEntry[] = [];
  let unsupportedCount = 0;

  for (const row of rows('Trades', 'Trade')) {
    // Orders and closed lots repeat the executions
    if (!row.tradeID || (row.levelOfDetail && row.levelOfDetail !== 'EXECUTION')) continue;

    const quantity = Number(row.quantity);
    const base = {
      externalRef: `ibkr_trade_${row.tradeID}`,
      currency: row.currency.toLowerCase(),
      amount: row.proceeds ? Number(row.proceeds) : -quantity * Number(row.tradePrice),
      date: toDate(row.tradeDate || row.dateTime),
      description: `${quantity > 0 ? 'Buy' : 'Sell'} ${Math.abs(quantity)} ${row.symbol} @ ${row.tradePrice}`,
      trade: null,
    };

    if (row.assetCategory === 'CASH') {
      // A conversion like EUR.USD: the quantity is in EUR, the proceeds are in USD
      const [baseCurrency, quoteCurrency] = row.symbol.split('.');
      const description = `${quantity > 0 ? 'Buy' : 'Sell'} ${Math.abs(quantity)} ${baseCurrency} @ ${row.tradePrice} ${quoteCurrency}`;
      entries.push(
        {
          ...base,
          type: 'exchange',
          currency: baseCurrency.toLowerCase(),
          amount: quantity,
          description,
        },
        { ...base, type: 'exchange', description },
      );
    } else if (isSecurity(row)) {
      entries.push({
        ...base,
        type: quantity > 0 ? 'buy' : 'sell',
        trade: { security: toSecurity(row), quantity, price: Number(row.tradePrice) },
      });
    } else {
      unsupportedCount++;
      continue;
    }

    if (Number(row.ibCommission)) {
      entries.push({
        ...base,
        externalRef: `ibkr_comm_${row.tradeID}`,
        type: 'broker_fee',
        currency: (row.ibCommissionCurrency || row.currency).toLowerCase(),
        amount: Number(row.ibCommission),
        description: `Commission for ${base.description}`,
      });
    }
  }

  for (const row of rows('CashTransactions', 'CashTransaction')) {
    if (row.levelOfDetail === 'SUMMARY') continue;

    const amount = Number(row.amount);
    const type = /deposit|withdraw/i.test(row.type)
      ? amount < 0
        ? 'withdrawal'
        : 'deposit'
      : CASH_TYPES[row.type.toLowerCase()];
    if (!type) {
      unsupportedCount++;
      continue;
    }

    entries.push({
      externalRef: `ibkr_cash_${row.transactionID}`,
      currency: row.currency.toLowerCase(),
      type,
      amount,
      date: toDate(row.reportDate || row.dateTime),
      description: row.description || row.type,
      trade: null,
    });
  }

  for (const row of rows('CorporateActions', 'CorporateAction')) {
    const quantity = Number(row.quantity);
    if (row.levelOfDetail === 'SUMMARY' || !quantity) continue;
    if (!isSecurity(row)) {
      unsupportedCount++;
      continue;
    }

    entries.push({
      // A reverse split has two rows, the old shares out and the new ones in, under one actionID
      externalRef: `ibkr_ca_${row.transactionID || row.actionID}`,
      currency: row.currency.toLowerCase(),
      type: row.type === 'FS' || row.type === 'RS' ? 'split' : 'security_transfer',
      // Cash in lieu of fractional shares, or a merger's cash
      amount: Number(row.proceeds) || 0,
      date: toDate(row.reportDate || row.dateTime),
      description: row.description,
      trade: { security: toSecurity(row), quantity, price: 0 },
    });
  }

  return {
    accountId: (statement.accountId as string) || account.accountId,
    dateOpened: toDate(account.dateOpened),
    endingCash: Object.fromEntries(
      rows('CashReport', 'CashReportCurrency')
        .filter((row) => row.currency !== 'BASE_SUMMARY')
        .map((row) => [row.currency.toLowerCase(), Number(row.endingCash)]),
    ),
    positions: rows('OpenPositions', 'OpenPosition')
      .filter((row) => row.levelOfDetail !== 'LOT' && isSecurity(row))
      .map((row) => ({
        security: toSecurity(row),
        quantity: Number(row.position),
        markPrice: Number(row.markPrice),
        date: toDate(row.reportDate).toISOString().slice(0, 10),
      })),
    entries,
    unsupportedCount,
  };
}

function readStatements(document: {
  FlexQueryResponse?: { FlexStatements?: { FlexStatement?: Record<string, unknown>[] } };
}) {
  const statements = document.FlexQueryResponse?.FlexStatements?.FlexStatement;
  if (!statements) {
    throw new IbkrFlexError('The IBKR Flex response has no statement.');
  }
  return statements.map(readStatement);
}

/** Parses an Activity Flex statement, one item per IBKR account */
export function parseFlexStatement(xml: string) {
  return readStatements(parser.parse(xml));
}

const nextRequestAt = new Map<string, number>();

async function waitForRequestSlot(token: string) {
  const now = Date.now();
  const at = Math.max(now, nextRequestAt.get(token) ?? 0);
  nextRequestAt.set(token, at + REQUEST_INTERVAL_MS);
  await new Promise((resolve) => setTimeout(resolve, at - now));
}

/** Requests until the response isn't a retryable error or the deadline passed */
async function request(
  endpoint: 'SendRequest' | 'GetStatement',
  params: Record<string, string>,
  deadline: number,
) {
  const url = `${env.IBKR_FLEX_BASE_URL ?? DEFAULT_BASE_URL}/${endpoint}?${new URLSearchParams({ ...params, v: '3' })}`;

  for (;;) {
    await waitForRequestSlot(params.t);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'money-compass' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new IbkrFlexError(`IBKR Flex ${endpoint} failed with HTTP ${response.status}.`);
    }

    const document = parser.parse(await response.text());
    const { ErrorCode: code, ErrorMessage: message } = document.FlexStatementResponse ?? {};
    if (!code) {
      return document;
    }
    if (!RETRY_CODES.includes(code) || Date.now() >= deadline) {
      throw new IbkrFlexError(`IBKR: ${message} (code ${code})`, code);
    }
  }
}

async function downloadStatement(params: Record<string, string>) {
  const deadline = Date.now() + TIMEOUT_MS;
  const sent = await request('SendRequest', params, deadline);
  const reference = String(sent.FlexStatementResponse?.ReferenceCode);
  return readStatements(await request('GetStatement', { t: params.t, q: reference }, deadline));
}

const pendingDownloads = new Map<string, Promise<FlexStatement[]>>();

/**
 * Generates the statement of an Activity Flex query and downloads it. Without a range, the
 * statement covers the query's period. A range spans at most 365 days.
 */
export function fetchFlexStatement(
  token: string,
  queryId: string,
  range?: { from: Date; to: Date },
) {
  const toFlexDate = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '');
  const params = {
    t: token,
    q: queryId,
    ...(range && { fd: toFlexDate(range.from), td: toFlexDate(range.to) }),
  };

  // The cron syncs the currencies of an IBKR account at once, so they share the download
  const key = JSON.stringify(params);
  let download = pendingDownloads.get(key);
  if (!download) {
    download = downloadStatement(params).finally(() => pendingDownloads.delete(key));
    pendingDownloads.set(key, download);
  }
  return download;
}
