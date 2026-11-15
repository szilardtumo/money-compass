import { InvestmentEntry, Portfolio, Position } from '@/lib/types/investments.types';

const TOTAL_BY_TYPE = {
  deposit: 'netContributions',
  withdrawal: 'netContributions',
  dividend: 'dividends',
  interest: 'interest',
  withholding_tax: 'taxes',
  broker_fee: 'fees',
} satisfies Record<string, Exclude<keyof Portfolio, 'positions'>>;

/** Removes shares at their average cost and returns the cost removed */
function removeShares(position: Position, quantity: number) {
  // quantity / quantity is exactly 1, so a full sell leaves no cost behind
  const cost = position.costBasis * (quantity / position.quantity);
  position.quantity -= quantity;
  position.costBasis -= cost;
  return cost;
}

/**
 * Folds broker transactions into positions and totals. Totals add up amounts as they are, so pass
 * the entries of one currency.
 */
export function reducePortfolio(entries: InvestmentEntry[]): Portfolio {
  const positions = new Map<string, Position>();
  const portfolio: Portfolio = {
    positions: [],
    netContributions: 0,
    dividends: 0,
    interest: 0,
    taxes: 0,
    fees: 0,
  };

  const sorted = entries.toSorted(
    (a, b) => a.startedDate.getTime() - b.startedDate.getTime() || a.sequence - b.sequence,
  );

  for (const entry of sorted) {
    if (!('trade' in entry)) {
      portfolio[TOTAL_BY_TYPE[entry.type]] += entry.amount;
      continue;
    }

    const { securityId, quantity, price } = entry.trade;
    const key = `${entry.subaccountId}:${securityId}`;
    let position = positions.get(key);
    if (!position) {
      position = {
        subaccountId: entry.subaccountId,
        securityId,
        quantity: 0,
        costBasis: 0,
        realizedGain: 0,
      };
      positions.set(key, position);
    }

    switch (entry.type) {
      case 'buy':
        position.quantity += quantity;
        position.costBasis -= entry.amount;
        break;
      case 'sell':
        position.realizedGain += entry.amount - removeShares(position, -quantity);
        break;
      case 'split':
        position.quantity += quantity;
        break;
      case 'security_transfer':
        if (quantity > 0) {
          position.quantity += quantity;
          position.costBasis += quantity * price;
        } else {
          removeShares(position, -quantity);
        }
        break;
    }
  }

  portfolio.positions = [...positions.values()];
  return portfolio;
}
