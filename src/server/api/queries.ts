import * as accounts from './accounts/queries';
import * as categories from './categories/queries';
import * as currencies from './currencies/queries';
import * as integrations from './integrations/queries';
import * as merchants from './merchants/queries';
import * as profiles from './profiles/queries';
import * as transactions from './transactions/queries';

type ApiQueries = Record<string, Record<string, (...args: never) => unknown>>;

export const apiQueries = {
  accounts,
  categories,
  currencies,
  integrations,
  merchants,
  profiles,
  transactions,
} satisfies ApiQueries;
