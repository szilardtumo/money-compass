import * as accounts from './accounts/actions';
import * as categories from './categories/actions';
import * as integrations from './integrations/actions';
import * as merchants from './merchants/actions';
import * as profiles from './profiles/actions';
import * as transactions from './transactions/actions';

type ApiActions = Record<string, Record<string, (...args: never) => unknown>>;

export const apiActions = {
  accounts,
  categories,
  integrations,
  merchants,
  profiles,
  transactions,
} satisfies ApiActions;
