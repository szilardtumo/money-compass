/** Yahoo's suffix for each IBKR listing exchange. US listings have none. */
const YAHOO_SUFFIXES: Partial<Record<string, string>> = {
  IBIS: '.DE',
  IBIS2: '.DE',
  LSE: '.L',
  LSEETF: '.L',
  WSE: '.WA',
  AEB: '.AS',
  SBF: '.PA',
  NASDAQ: '',
  NYSE: '',
  ARCA: '',
  AMEX: '',
  BATS: '',
};

/** A close in the main unit of its currency, so pence become pounds */
export interface DailyClose {
  date: string;
  close: number;
  currency: string;
}

interface YahooChart {
  chart: {
    result:
      | {
          meta: { currency: string; gmtoffset: number };
          timestamp?: number[];
          indicators: { quote: { close?: (number | null)[] }[] };
        }[]
      | null;
  };
}

/** The Yahoo symbol of an IBKR listing, or null when its exchange isn't in the table */
export function toQuoteSymbol(symbol: string, exchange: string) {
  const suffix = YAHOO_SUFFIXES[exchange];
  return suffix === undefined ? null : `${symbol}${suffix}`;
}

/**
 * Returns the daily closes since `from` from Yahoo's chart API, or null when Yahoo doesn't know
 * the symbol.
 */
export async function fetchDailyCloses(
  quoteSymbol: string,
  from: Date,
): Promise<DailyClose[] | null> {
  const params = new URLSearchParams({
    period1: String(Math.floor(from.getTime() / 1000)),
    period2: String(Math.floor(Date.now() / 1000)),
    interval: '1d',
  });
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(quoteSymbol)}?${params}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Yahoo answered ${response.status} for ${quoteSymbol}.`);
  }

  const [result] = ((await response.json()) as YahooChart).chart.result ?? [];
  if (!result) {
    return null;
  }
  const { currency, gmtoffset } = result.meta;
  const isPence = currency === 'GBp' || currency === 'GBX';
  const closes = result.indicators.quote[0]?.close ?? [];

  return (result.timestamp ?? []).flatMap((timestamp, index) => {
    const close = closes[index];
    if (close == null) {
      return [];
    }
    // Yahoo sends 32-bit floats, so 168.06 arrives as 168.05999755859375
    const value = Number(close.toPrecision(7));
    return {
      // The timestamp is the session's start, so the exchange's offset gives its local date
      date: new Date((timestamp + gmtoffset) * 1000).toISOString().slice(0, 10),
      close: isPence ? value / 100 : value,
      currency: isPence ? 'gbp' : currency.toLowerCase(),
    };
  });
}

/**
 * Returns the rates from `base` to each of the `quotes` currencies since `from` from Frankfurter, by
 * date and then by currency. Days without rates are missing.
 */
export async function fetchFxSeries(base: string, quotes: string[], from: Date) {
  const params = new URLSearchParams({
    base: base.toUpperCase(),
    quotes: quotes.join(',').toUpperCase(),
    from: from.toISOString().slice(0, 10),
  });
  const response = await fetch(`https://api.frankfurter.dev/v2/rates?${params}`);
  if (!response.ok) {
    throw new Error(`Frankfurter answered ${response.status} for ${base} to ${quotes.join(', ')}.`);
  }

  const series: Record<string, Record<string, number>> = {};
  for (const { date, quote, rate } of (await response.json()) as {
    date: string;
    quote: string;
    rate: number;
  }[]) {
    (series[date] ??= {})[quote.toLowerCase()] = rate;
  }
  return series;
}
