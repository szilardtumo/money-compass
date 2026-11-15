import { describe, expect, it, vi } from 'vitest';

import { InvestmentEntry } from '@/lib/types/investments.types';

import { BrokerSubaccount, Holding, summarizePortfolio } from './overview';

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
