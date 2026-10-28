export type CategoryKind = 'expense' | 'income' | 'excluded';

export const CATEGORY_KINDS: { kind: CategoryKind; label: string }[] = [
  { kind: 'expense', label: 'Spending' },
  { kind: 'income', label: 'Income' },
  { kind: 'excluded', label: 'Excluded from analytics' },
];

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

export interface CategoryWithCounts extends Category {
  merchantCount: number;
  transactionCount: number;
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
  lastSeen: Date | null;
}
