export interface Currency {
  id: string;
  name: string;
  country: string;
}

export interface CurrencyValue {
  originalValue: number;
  mainCurrencyValue: number;
}

export type CurrencyMapper = Record<string, number>;
