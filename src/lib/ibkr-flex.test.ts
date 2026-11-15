import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchFlexStatement, IbkrFlexError, parseFlexStatement } from './ibkr-flex';

vi.mock('@/lib/env', () => ({ env: {} }));

const xml = readFileSync(
  new URL('./investments/__fixtures__/flex-statement.xml', import.meta.url),
  'utf8',
);

const flexResponse = (body: string) =>
  `<FlexStatementResponse timestamp="15 November, 2026 06:00 AM EST">${body}</FlexStatementResponse>`;

describe('parseFlexStatement', () => {
  const [statement] = parseFlexStatement(xml);
  const count = (type: string) => statement.entries.filter((entry) => entry.type === type).length;

  it('maps the rows to transactions', () => {
    expect(statement.accountId).toBe('U7000001');
    expect(statement.dateOpened).toEqual(new Date('2024-11-20'));
    expect(statement.endingCash).toEqual({ eur: 2970.12, usd: 204.71 });
    expect(count('buy')).toBe(3);
    expect(count('sell')).toBe(1);
    expect(count('dividend')).toBe(1);
    expect(count('withholding_tax')).toBe(1);
    expect(count('broker_fee')).toBe(5);
    expect(count('deposit')).toBe(1);
    expect(count('split')).toBe(1);
  });

  it('tags a dividend and its tax with the security they are about', () => {
    const isins = statement.entries
      .filter((entry) => entry.type === 'dividend' || entry.type === 'withholding_tax')
      .map((entry) => entry.isin);
    expect(isins).toEqual(['US0378331005', 'US0378331005']);
  });

  it('maps the first trade to a buy with its trade row', () => {
    expect(statement.entries[0]).toEqual({
      externalRef: 'ibkr_trade_700001',
      currency: 'eur',
      type: 'buy',
      amount: -4492,
      date: new Date('2024-12-05'),
      description: 'Buy 40 VWCE @ 112.30',
      trade: {
        security: {
          isin: 'IE00BK5BQT80',
          symbol: 'VWCE',
          exchange: 'IBIS',
          name: 'VANGUARD FTSE ALL-WORLD UCITS',
          currency: 'eur',
          kind: 'etf',
        },
        quantity: 40,
        price: 112.3,
      },
    });
  });

  it('maps a currency conversion to two exchange legs with one reference', () => {
    expect(
      statement.entries
        .filter((entry) => entry.type === 'exchange')
        .map(({ externalRef, currency, amount }) => ({ externalRef, currency, amount })),
    ).toEqual([
      { externalRef: 'ibkr_trade_700002', currency: 'eur', amount: -2000 },
      { externalRef: 'ibkr_trade_700002', currency: 'usd', amount: 2170 },
    ]);
  });
});

describe('fetchFlexStatement', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('polls again while the statement is being generated', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(flexResponse('<Status>Success</Status><ReferenceCode>555</ReferenceCode>')),
      )
      .mockResolvedValueOnce(
        new Response(
          flexResponse(
            '<Status>Warn</Status><ErrorCode>1019</ErrorCode><ErrorMessage>Statement generation in progress. Please try again shortly.</ErrorMessage>',
          ),
        ),
      )
      .mockResolvedValueOnce(new Response(xml));
    vi.stubGlobal('fetch', fetchMock);

    const result = fetchFlexStatement('token-a', '123', {
      from: new Date('2025-11-16'),
      to: new Date('2026-11-15'),
    });
    await vi.runAllTimersAsync();

    expect((await result)[0].entries).toHaveLength(16);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/SendRequest?t=token-a&q=123&fd=20251116&td=20261115&v=3',
      'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/GetStatement?t=token-a&q=555&v=3',
      'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/GetStatement?t=token-a&q=555&v=3',
    ]);
  });

  it('throws a revoked error when the token expired', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            flexResponse(
              '<Status>Fail</Status><ErrorCode>1012</ErrorCode><ErrorMessage>Token has expired.</ErrorMessage>',
            ),
          ),
        ),
    );

    const error = await fetchFlexStatement('token-b', '123').catch((error) => error);

    expect(error).toBeInstanceOf(IbkrFlexError);
    expect(error).toMatchObject({
      message: 'IBKR: Token has expired. (code 1012)',
      code: '1012',
      revoked: true,
    });
  });
});
