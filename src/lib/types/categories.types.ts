export type CategoryKind = 'expense' | 'income' | 'excluded';

export const CATEGORY_KINDS: { kind: CategoryKind; label: string; shortLabel: string }[] = [
  { kind: 'expense', label: 'Spending', shortLabel: 'Spending' },
  { kind: 'income', label: 'Income', shortLabel: 'Income' },
  { kind: 'excluded', label: 'Excluded from analytics', shortLabel: 'Excluded' },
];

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

export interface CategoryWithStats extends Category {
  merchantCount: number;
  transactionCount: number;
  /** The sum of the last 12 months in the main currency, negative for spending */
  yearTotal: number;
  /** The same per month, oldest first */
  monthlyTotals: number[];
}

/** A merchant of a category, with its last 12 months */
export interface CategoryMerchant {
  id: string;
  name: string;
  transactionCount: number;
  /** In the main currency, negative for spending */
  total: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: Category | null;
  /** The normalized raw names that belong to the merchant, with their transaction counts */
  keys: { key: string; transactionCount: number }[];
  transactionCount: number;
  /** The sum of the last 12 months in the main currency, negative for spending */
  yearTotal: number;
  /** The same per month, oldest first */
  monthlyTotals: number[];
  lastSeen: Date | null;
}
