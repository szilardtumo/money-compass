import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchDailyCloses, toQuoteSymbol } from './market-data';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('toQuoteSymbol', () => {
  it('adds the Yahoo suffix of the IBKR exchange', () => {
    expect(toQuoteSymbol('VWCE', 'IBIS')).toBe('VWCE.DE');
    expect(toQuoteSymbol('PKO', 'WSE')).toBe('PKO.WA');
    expect(toQuoteSymbol('AAPL', 'NASDAQ')).toBe('AAPL');
  });

  it('returns null for an exchange without a suffix', () => {
    expect(toQuoteSymbol('ABC', 'TSEJ')).toBeNull();
  });
});

describe('fetchDailyCloses', () => {
  it('converts pence to pounds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          chart: {
            result: [
              {
                meta: { currency: 'GBp', gmtoffset: 0 },
                // 2026-11-13 08:00 UTC
                timestamp: [1794556800],
                indicators: { quote: [{ close: [7500] }] },
              },
            ],
          },
        }),
      ),
    );

    expect(await fetchDailyCloses('VUSA.L', new Date('2026-11-13'))).toEqual([
      { date: '2026-11-13', close: 75, currency: 'gbp' },
    ]);
  });

  it('returns null for a symbol Yahoo does not know', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ chart: { result: null, error: { code: 'Not Found' } } }, { status: 404 }),
        ),
    );

    expect(await fetchDailyCloses('NOPE.DE', new Date('2026-11-13'))).toBeNull();
  });
});
