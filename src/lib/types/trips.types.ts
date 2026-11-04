import { Category } from './categories.types';

export interface Trip {
  id: string;
  name: string;
  /** Its transactions count in it, unless they have a category of their own */
  category: Category | null;
  /** Like "2026-09-04", when the trip itself was */
  startDate: string;
  endDate: string;
  transactionCount: number;
  /** Of the transactions that count in analytics, in the main currency, negative for spending */
  total: number;
  /** The same by the category the transactions would have without the trip, the biggest first */
  breakdown: { category: Category | null; total: number }[];
}

/** Days with payments in another currency than usual, which may be a trip without one */
export interface TripSuggestion {
  /** Like "2026-09-04" */
  startDate: string;
  endDate: string;
  /** Like ["eur"] */
  currencies: string[];
  /** The payments in those currencies */
  transactionIds: string[];
}
