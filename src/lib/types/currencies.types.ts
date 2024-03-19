export interface Currency {
  id: string;
  name: string;
  country: string;
}

export type CurrencyMapper = Record<string, number>;
