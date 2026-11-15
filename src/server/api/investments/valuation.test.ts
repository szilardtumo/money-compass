import { describe, expect, it, vi } from 'vitest';

import { InvestmentEntry } from '@/lib/types/investments.types';

import { addMarketValue, MonthlyBalances, valuePortfolio } from './valuation';

vi.mock('@/server/db', () => ({}));

let sequence = 0;

function trade(
  type: 'buy' | 'sell',
  date: string,
  securityId: string,
  quantity: number,
  price: number,
): InvestmentEntry {
  return {
    type,
    amount: -quantity * price,
    subaccountId: 'eur',
    startedDate: new Date(date),
    sequence: ++sequence,
    trade: { securityId, quantity, price },
  };
}

describe('valuePortfolio', () => {
  it('values each day at its close and keeps the last close over a holiday', () => {
    const entries = [
      trade('buy', '2026-03-02', 'vwce', 10, 100),
      trade('sell', '2026-03-05', 'vwce', -4, 105),
      {
        type: 'dividend',
        amount: 30,
        subaccountId: 'eur',
        startedDate: new Date('2026-03-03'),
        sequence: ++sequence,
      } as const,
    ];
    const closes = [
      { securityId: 'vwce', date: '2026-03-02', close: 101, currency: 'eur' },
      { securityId: 'vwce', date: '2026-03-03', close: 102, currency: 'eur' },
      // 2026-03-04 is a holiday
      { securityId: 'vwce', date: '2026-03-05', close: 104, currency: 'eur' },
    ];

    // 10 shares until the sell of 4 on March 5 leaves 6 at an average cost of 100
    expect(valuePortfolio({ entries, closes, currency: 'eur', to: '2026-03-06' })).toEqual([
      { date: '2026-03-02', marketValue: 1010, costBasis: 1000 },
      { date: '2026-03-03', marketValue: 1020, costBasis: 1000 },
      { date: '2026-03-04', marketValue: 1020, costBasis: 1000 },
      { date: '2026-03-05', marketValue: 624, costBasis: 600 },
      { date: '2026-03-06', marketValue: 624, costBasis: 600 },
    ]);
  });

  it('converts closes in another currency and uses the trade price before the first close', () => {
    const entries = [trade('buy', '2026-03-02', 'aapl', 2, 40)];
    const closes = [{ securityId: 'aapl', date: '2026-03-03', close: 55, currency: 'usd' }];
    const fx = { '2026-03-02': { usd: 1.25 } };

    // 2 * 40 on the trade day, then 2 * 55 / 1.25 = 88 with the rate of the day before
    expect(valuePortfolio({ entries, closes, currency: 'eur', fx, to: '2026-03-03' })).toEqual([
      { date: '2026-03-02', marketValue: 80, costBasis: 80 },
      { date: '2026-03-03', marketValue: 88, costBasis: 80 },
    ]);
  });

  it('returns no rows without trades', () => {
    expect(valuePortfolio({ entries: [], closes: [], currency: 'eur', to: '2026-03-03' })).toEqual(
      [],
    );
  });
});

describe('addMarketValue', () => {
  it('adds the last valuation on or before each month end to the cash', () => {
    const monthly: MonthlyBalances[] = [
      { month: '2026-02', balances: { eur: 50 } },
      { month: '2026-03', balances: { eur: 100 } },
      { month: '2026-04', balances: { eur: 150, usd: 20 } },
    ];
    const valuations = [
      { subaccountId: 'eur', date: '2026-04-30', marketValue: 540 },
      { subaccountId: 'eur', date: '2026-03-30', marketValue: 500 },
      { subaccountId: 'eur', date: '2026-03-31', marketValue: 510 },
      { subaccountId: 'eur', date: '2026-04-15', marketValue: 530 },
    ];

    // February has no valuation, March takes March 31 and April takes April 30
    expect(addMarketValue(monthly, valuations)).toEqual([
      { month: '2026-02', balances: { eur: 50 } },
      { month: '2026-03', balances: { eur: 610 } },
      { month: '2026-04', balances: { eur: 690, usd: 20 } },
    ]);
  });
});
