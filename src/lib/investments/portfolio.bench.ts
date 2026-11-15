import { expect, test } from 'vitest';

import { InvestmentEntry } from '@/lib/types/investments.types';

import { reducePortfolio } from './portfolio';

const entries: InvestmentEntry[] = Array.from({ length: 5000 }, (_, i) => {
  const base = {
    subaccountId: 'eur',
    startedDate: new Date(Date.UTC(2020, 0, 1 + Math.floor(i / 3))),
    sequence: i,
  };
  const trade = { securityId: `security-${i % 60}`, price: 100 };
  if (i % 10 === 9) {
    return { ...base, type: 'dividend', amount: 12 };
  }
  return i % 5 === 4
    ? { ...base, type: 'sell', amount: 100, trade: { ...trade, quantity: -1 } }
    : { ...base, type: 'buy', amount: -300, trade: { ...trade, quantity: 3 } };
});

test('reducePortfolio folds 5,000 entries across 60 securities within 50 ms', async ({ bench }) => {
  const result = await bench('reducePortfolio', () => {
    reducePortfolio(entries);
  }).run();
  expect(result.latency.p50).toBeLessThan(50);
});
