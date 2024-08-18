import * as accounts from './accounts.queries';
import * as currencies from './currencies.queries';
import * as profiles from './profiles.queries';
import * as transactions from './transactions.queries';

type ApiQueries = Record<string, Record<string, (...args: never) => unknown>>;

export const apiQueries = {
  accounts,
  currencies,
  profiles,
  transactions,
} satisfies ApiQueries;
