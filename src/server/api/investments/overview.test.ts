import { describe, expect, it, vi } from 'vitest';

import { InvestmentEntry } from '@/lib/types/investments.types';

import {
  BrokerSubaccount,
  DividendPayment,
  groupDividends,
  Holding,
  summarizePortfolio,
  toReturnFlows,
} from './overview';

vi.mock('@/server/db', () => ({}));

const cash = (
  subaccountId: string,
  type: 'deposit' | 'withdrawal' | 'dividend' | 'withholding_tax',
  date: string,
  amount: number,
): InvestmentEntry => ({ type, amount, subaccountId, startedDate: new Date(date), sequence: 1 });

const holding = (
  subaccountId: string,
  accountName: string,
  currency: string,
  kind: Holding['kind'],
  value: number,
  unrealizedGain: number,
  dayChange: number,
): Holding => ({
  subaccountId,
  securityId: `${subaccountId}-security`,
  symbol: 'SYM',
  name: 'Security',
  kind,
  accountName,
  currency,
  isUnpriced: false,
  quantity: 1,
  averageCost: value - unrealizedGain,
  lastPrice: value,
  priceCurrency: currency,
  value,
  unrealizedGain,
  dayChange,
  closes: [],
});

describe('summarizePortfolio', () => {
  it('totals a EUR and a USD account in the main currency', () => {
    const subaccounts: BrokerSubaccount[] = [
      {
        id: 'eur',
        accountId: 'ibkr',
        accountName: 'IBKR',
        currency: 'eur',
        cash: 200,
        marketValue: 1100,
        entries: [
          cash('eur', 'deposit', '2026-01-10', 1000),
          cash('eur', 'deposit', '2026-02-10', 500),
          cash('eur', 'withdrawal', '2026-03-10', -200),
          cash('eur', 'dividend', '2026-06-01', 30),
          cash('eur', 'withholding_tax', '2026-06-01', -4.5),
          // More than a year before now
          cash('eur', 'dividend', '2025-01-01', 50),
        ],
      },
      {
        id: 'usd',
        accountId: 'broker',
        accountName: 'Broker',
        currency: 'usd',
        cash: 100,
        marketValue: 2000,
        entries: [
          cash('usd', 'deposit', '2025-06-01', 1500),
          cash('usd', 'dividend', '2026-09-01', 20),
          cash('usd', 'withholding_tax', '2026-09-01', -3),
        ],
      },
    ];
    // The USD holding is worth 2000 dollars, 1000 euros
    const holdings = [
      holding('eur', 'IBKR', 'eur', 'etf', 1100, 100, 10),
      holding('usd', 'Broker', 'usd', 'stock', 1000, 150, -4),
    ];

    const summary = summarizePortfolio({
      subaccounts,
      holdings,
      mainCurrency: 'eur',
      mapper: { eur: 1, usd: 0.5 },
      now: new Date('2026-11-15'),
    });

    // Value: 200 + 1100 + (100 + 2000) * 0.5. Net invested: 1000 + 500 - 200 + 1500 * 0.5.
    // Dividends: 30 - 4.5 + (20 - 3) * 0.5, without the one from 2025-01-01.
    expect(summary).toEqual({
      mainCurrency: 'eur',
      totalValue: 2350,
      holdingsValue: 2100,
      netInvested: 2050,
      unrealizedGain: 250,
      dividends: 34,
      dayChange: 6,
      allocation: [
        { account: 'IBKR', currency: 'eur', kind: 'etf', value: 1100 },
        { account: 'Broker', currency: 'usd', kind: 'stock', value: 1000 },
        { account: 'IBKR', currency: 'eur', kind: 'cash', value: 200 },
        { account: 'Broker', currency: 'usd', kind: 'cash', value: 50 },
      ],
    });
  });
});

describe('groupDividends', () => {
  const payment = (date: string, amount: number, isin: string | null): DividendPayment => ({
    transactionId: `${date}-${amount}`,
    subaccountId: 'usd',
    date: new Date(date),
    amount,
    isin,
  });
  const aapl = 'US0378331005';
  const ko = 'US1912161007';

  it('sums each month after withholding tax and groups the last 12 months by security', () => {
    const dividends = groupDividends({
      payments: [
        payment('2024-11-14', 99, aapl),
        payment('2025-02-13', 10, aapl),
        payment('2025-02-13', -1.5, aapl),
        payment('2026-08-14', 20, aapl),
        payment('2026-08-14', -3, aapl),
        payment('2026-08-28', 8, ko),
        payment('2026-08-28', -1.2, ko),
        payment('2026-11-02', 4, null),
      ],
      securities: [
        { id: 'aapl', symbol: 'AAPL', name: 'APPLE INC', isin: aapl },
        { id: 'ko', symbol: 'KO', name: 'COCA-COLA CO', isin: ko },
      ],
      now: new Date('2026-11-15'),
    });

    // 2024-11 is 24 months back, one month too old
    expect(dividends.months).toHaveLength(24);
    expect(dividends.months[0]).toEqual({ month: '2024-12', amount: 0 });
    expect(dividends.months.at(-1)).toEqual({ month: '2026-11', amount: 4 });
    expect(dividends.months.filter((item) => item.amount)).toEqual([
      { month: '2025-02', amount: 8.5 },
      { month: '2026-08', amount: 23.8 },
      { month: '2026-11', amount: 4 },
    ]);
    // 2025-02 is more than 12 months back
    expect(dividends.total).toBeCloseTo(27.8, 10);
    expect(dividends.bySecurity).toEqual([
      { security: { id: 'aapl', symbol: 'AAPL', name: 'APPLE INC', isin: aapl }, amount: 17 },
      {
        security: { id: 'ko', symbol: 'KO', name: 'COCA-COLA CO', isin: ko },
        amount: expect.closeTo(6.8),
      },
      { security: null, amount: 4 },
    ]);
  });
});

describe('toReturnFlows', () => {
  const history = [
    { date: '2025-01-01', value: 1000, netInvested: 1000 },
    { date: '2025-06-30', value: 1050, netInvested: 1000 },
    { date: '2025-07-01', value: 1550, netInvested: 1500 },
    { date: '2026-01-01', value: 1400, netInvested: 1300 },
    { date: '2026-11-15', value: 1700, netInvested: 1300 },
  ];

  it('counts the deposits as money put in and the last value as money taken out', () => {
    expect(toReturnFlows(history)).toEqual([
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2025-07-01'), amount: -500 },
      { date: new Date('2026-01-01'), amount: 200 },
      { date: new Date('2026-11-15'), amount: 1700 },
    ]);
  });

  it('counts the value before the start as money put in at the start', () => {
    expect(toReturnFlows(history, '2025-07-01')).toEqual([
      { date: new Date('2025-07-01'), amount: -1050 },
      { date: new Date('2025-07-01'), amount: -500 },
      { date: new Date('2026-01-01'), amount: 200 },
      { date: new Date('2026-11-15'), amount: 1700 },
    ]);
  });

  it('leaves only the last value without a start value or deposits, so xirr finds none', () => {
    expect(toReturnFlows([{ date: '2026-11-15', value: 0, netInvested: 0 }], '2026-01-01')).toEqual(
      [{ date: new Date('2026-11-15'), amount: 0 }],
    );
  });
});
