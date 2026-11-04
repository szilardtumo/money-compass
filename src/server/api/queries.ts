import * as accounts from './accounts/queries';
import * as analytics from './analytics/queries';
import * as categories from './categories/queries';
import * as currencies from './currencies/queries';
import * as integrations from './integrations/queries';
import * as merchants from './merchants/queries';
import * as profiles from './profiles/queries';
import * as transactions from './transactions/queries';
import * as trips from './trips/queries';

type ApiQueries = Record<string, Record<string, (...args: never) => unknown>>;

export const apiQueries = {
  accounts,
  analytics,
  categories,
  currencies,
  integrations,
  merchants,
  profiles,
  trips,
  transactions,
} satisfies ApiQueries;
