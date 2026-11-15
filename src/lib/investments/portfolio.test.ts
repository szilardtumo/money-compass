import { describe, expect, it } from 'vitest';

import { InvestmentEntry } from '@/lib/types/investments.types';

import { reducePortfolio } from './portfolio';

let sequence = 0;

function trade(
  type: 'buy' | 'sell' | 'split' | 'security_transfer',
  amount: number,
  quantity: number,
  price: number,
  date = '2026-01-01',
): InvestmentEntry {
  return {
    type,
    amount,
    subaccountId: 'eur',
    startedDate: new Date(date),
    sequence: ++sequence,
    trade: { securityId: 'vwce', quantity, price },
  };
}

function cash(
  type: 'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'withholding_tax' | 'broker_fee',
  amount: number,
): InvestmentEntry {
  return {
    type,
    amount,
    subaccountId: 'eur',
    startedDate: new Date('2026-01-01'),
    sequence: ++sequence,
  };
}

const noTotals = { netContributions: 0, dividends: 0, interest: 0, taxes: 0, fees: 0 };

function position(quantity: number, costBasis: number, realizedGain: number) {
  return { subaccountId: 'eur', securityId: 'vwce', quantity, costBasis, realizedGain };
}

describe('reducePortfolio', () => {
  it('adds a buy at its cash cost', () => {
    // 10 shares for 500
    expect(reducePortfolio([trade('buy', -500, 10, 50)])).toEqual({
      positions: [position(10, 500, 0)],
      ...noTotals,
    });
  });

  it('sells part of a position at its average cost', () => {
    // 20 shares for 1200 cost 60 each. Selling 5 for 400 removes 5 * 60 = 300 of cost and gains
    // 400 - 300 = 100, leaving 15 shares for 900.
    const entries = [
      trade('buy', -500, 10, 50),
      trade('buy', -700, 10, 70),
      trade('sell', 400, -5, 80),
    ];
    expect(reducePortfolio(entries)).toEqual({
      positions: [position(15, 900, 100)],
      ...noTotals,
    });
  });

  it('starts a new cost pool after a full sell', () => {
    // Selling all 10 shares for 600 gains 600 - 500 = 100. The 5 shares bought again for 400 cost
    // 80 each, unmixed with the old 50.
    const entries = [
      trade('buy', -500, 10, 50),
      trade('sell', 600, -10, 60),
      trade('buy', -400, 5, 80),
    ];
    expect(reducePortfolio(entries)).toEqual({
      positions: [position(5, 400, 100)],
      ...noTotals,
    });
  });

  it('doubles the quantity on a 2-for-1 split and keeps the cost', () => {
    // 10 shares for 1000 become 20 shares for 1000, 50 each. Selling 4 for 240 removes 4 * 50 =
    // 200 of cost and gains 40.
    const entries = [
      trade('buy', -1000, 10, 100),
      trade('split', 0, 10, 0),
      trade('sell', 240, -4, 60),
    ];
    expect(reducePortfolio(entries)).toEqual({
      positions: [position(16, 800, 40)],
      ...noTotals,
    });
  });

  it('moves shares in at their transfer price and out at their average cost', () => {
    // 10 shares come in at 30, a cost of 300. 4 leave with 4 * 30 = 120 of cost, without a gain.
    const entries = [trade('security_transfer', 0, 10, 30), trade('security_transfer', 0, -4, 0)];
    expect(reducePortfolio(entries)).toEqual({
      positions: [position(6, 180, 0)],
      ...noTotals,
    });
  });

  it('counts a dividend and its withholding tax apart', () => {
    expect(reducePortfolio([cash('dividend', 100), cash('withholding_tax', -15)])).toEqual({
      positions: [],
      ...noTotals,
      dividends: 100,
      taxes: -15,
    });
  });

  it('counts broker fees and interest', () => {
    expect(
      reducePortfolio([cash('broker_fee', -2.5), cash('broker_fee', -1), cash('interest', 3)]),
    ).toEqual({ positions: [], ...noTotals, fees: -3.5, interest: 3 });
  });

  it('nets withdrawals against deposits', () => {
    // 1000 in, 300 out
    expect(reducePortfolio([cash('deposit', 1000), cash('withdrawal', -300)])).toEqual({
      positions: [],
      ...noTotals,
      netContributions: 700,
    });
  });

  it('applies entries by date, then by sequence', () => {
    // The rebuy of January 10 has the lowest sequence but runs last. The January 5 buy runs before
    // the January 5 sell by sequence, so the sell empties the pool and gains 600 - 500 = 100.
    const rebuy = trade('buy', -400, 5, 80, '2026-01-10');
    const buy = trade('buy', -500, 10, 50, '2026-01-05');
    const sell = trade('sell', 600, -10, 60, '2026-01-05');
    expect(reducePortfolio([sell, rebuy, buy])).toEqual({
      positions: [position(5, 400, 100)],
      ...noTotals,
    });
  });
});
