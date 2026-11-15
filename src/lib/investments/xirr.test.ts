import { describe, expect, it } from 'vitest';

import { xirr } from './xirr';

describe('xirr', () => {
  it('returns 10% for 1000 invested and 1100 back a year later', () => {
    const flows = [
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2026-01-01'), amount: 1100 },
    ];
    expect(xirr(flows)).toBeCloseTo(0.1, 8);
  });

  it('returns 10% for two yearly investments of 1000 worth 2310 after two years', () => {
    // 1000 * 1.1^2 + 1000 * 1.1 = 1210 + 1100 = 2310
    const flows = [
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2026-01-01'), amount: -1000 },
      { date: new Date('2027-01-01'), amount: 2310 },
    ];
    expect(xirr(flows)).toBeCloseTo(0.1, 8);
  });

  it('returns -50% for 1000 invested and 500 back a year later', () => {
    const flows = [
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2026-01-01'), amount: 500 },
    ];
    expect(xirr(flows)).toBeCloseTo(-0.5, 8);
  });

  it('annualizes a 10% loss over 30 days to -72.25%', () => {
    // 0.9 ^ (365 / 30) - 1
    const flows = [
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2025-01-31'), amount: 900 },
    ];
    expect(xirr(flows)).toBeCloseTo(-0.722487, 6);
  });

  it('returns null when no money was invested', () => {
    const flows = [
      { date: new Date('2025-01-01'), amount: 1000 },
      { date: new Date('2026-01-01'), amount: 1100 },
    ];
    expect(xirr(flows)).toBeNull();
  });
});
