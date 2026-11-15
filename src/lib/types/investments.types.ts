export interface InvestmentTrade {
  securityId: string;
  /** Negative when shares leave the position */
  quantity: number;
  price: number;
}

interface InvestmentEntryBase {
  subaccountId: string;
  startedDate: Date;
  sequence: number;
  /** In the subaccount's currency, negative when cash leaves it */
  amount: number;
}

/** A broker transaction as the portfolio calculation reads it */
export type InvestmentEntry = InvestmentEntryBase &
  (
    | { type: 'buy' | 'sell' | 'split' | 'security_transfer'; trade: InvestmentTrade }
    | {
        type: 'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'withholding_tax' | 'broker_fee';
      }
  );

export interface Position {
  subaccountId: string;
  securityId: string;
  quantity: number;
  /** In the subaccount's currency, by the average cost method */
  costBasis: number;
  realizedGain: number;
}

/** Totals are sums of signed amounts, so taxes and fees are negative */
export interface Portfolio {
  positions: Position[];
  /** Deposits minus withdrawals */
  netContributions: number;
  dividends: number;
  interest: number;
  taxes: number;
  fees: number;
}
