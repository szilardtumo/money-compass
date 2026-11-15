export interface CashFlow {
  date: Date;
  /** Negative for money invested, positive for money returned */
  amount: number;
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const TOLERANCE = 1e-10;

/**
 * Returns the annual money-weighted return of the flows, like 0.1 for 10%, or null when there is
 * none or it can't be found.
 */
export function xirr(flows: CashFlow[]): number | null {
  if (!flows.some((flow) => flow.amount > 0) || !flows.some((flow) => flow.amount < 0)) {
    return null;
  }

  const start = Math.min(...flows.map((flow) => flow.date.getTime()));
  const years = flows.map((flow) => (flow.date.getTime() - start) / YEAR_MS);
  const npv = (rate: number) =>
    flows.reduce((sum, flow, i) => sum + flow.amount / (1 + rate) ** years[i], 0);
  const npvSlope = (rate: number) =>
    flows.reduce(
      (sum, flow, i) => sum - (years[i] * flow.amount) / (1 + rate) ** (years[i] + 1),
      0,
    );

  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const next = rate - npv(rate) / npvSlope(rate);
    if (!Number.isFinite(next) || next <= -1) {
      break;
    }
    if (Math.abs(next - rate) < TOLERANCE) {
      return next;
    }
    rate = next;
  }

  let low = -0.9999;
  let high = 1;
  while (Math.sign(npv(low)) === Math.sign(npv(high))) {
    if (high > 1e6) {
      return null;
    }
    high *= 2;
  }
  while (high - low > TOLERANCE) {
    const mid = (low + high) / 2;
    if (Math.sign(npv(mid)) === Math.sign(npv(low))) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}
