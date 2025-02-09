import * as accounts from './accounts.actions';
import * as integrationLinks from './integration-links.actions';
import * as integrations from './integrations.actions';
import * as profiles from './profiles.actions';
import * as transactions from './transactions.actions';

type ApiActions = Record<string, Record<string, (...args: never) => unknown>>;

export const apiActions = {
  accounts,
  profiles,
  transactions,
  integrations,
  integrationLinks,
} satisfies ApiActions;
