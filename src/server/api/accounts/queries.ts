import 'server-only';

import { InferSelectModel } from 'drizzle-orm';

import { CACHE_TAGS, cacheTag } from '@/lib/cache';
import { MissingExchangeRateError } from '@/lib/errors';
import { Account, Subaccount } from '@/lib/types/accounts.types';
import { getDb, schema } from '@/server/db';
import { accounts as accountsSchema, subaccounts as subaccountsSchema } from '@/server/db/schema';

import { createAuthenticatedApiQuery } from '../create-api-query';
import { getMainCurrencyWithMapper } from '../currencies/queries';

type DbAccount = InferSelectModel<typeof accountsSchema> & {
  subaccounts: InferSelectModel<typeof subaccountsSchema>[];
};

type SubaccountBalances = Record<
  string,
  {
    balance: number;
    lastTransactionDate: Date;
  }
>;

/**
 * Maps database account record to the Account type with all subaccounts and balance information
 */
const mapAccountData = (
  account: DbAccount,
  mainCurrency: string,
  mainCurrencyMapper: Record<string, number>,
  subaccountBalances: SubaccountBalances,
): Account => {
  // Map subaccounts first
  const subaccounts: Subaccount[] = account.subaccounts.map((subaccount) => {
    const originalValue = subaccountBalances[subaccount.id]?.balance ?? 0;
    const exchangeRate = mainCurrencyMapper[subaccount.currency];

    if (!exchangeRate) {
      throw new MissingExchangeRateError(subaccount.currency);
    }

    return {
      id: subaccount.id,
      name: subaccount.name,
      originalCurrency: subaccount.currency,
      mainCurrency,
      balance: {
        originalValue,
        mainCurrencyValue: originalValue * exchangeRate,
      },
      accountId: account.id,
    };
  });

  // Then create the account with the mapped subaccounts
  return {
    id: account.id,
    name: account.name,
    category: account.category,
    mainCurrency,
    totalBalance: subaccounts.reduce((acc, current) => acc + current.balance.mainCurrencyValue, 0),
    subaccounts,
  };
};

/**
 * Returns the balances of all subaccounts for the user.
 */
export const getSubaccountBalances = createAuthenticatedApiQuery<void, SubaccountBalances>(
  async ({ ctx }) => {
    // Set up cache tags
    'use cache';
    cacheTag.user(ctx.userId, CACHE_TAGS.accounts);
    cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

    const db = await getDb(ctx.supabaseToken);

    // Get all the balances
    const balances = await db.rls((tx) => tx.select().from(schema.balances));

    // Map the balances to the desired format
    return Object.fromEntries(
      balances.map((item) => [
        item.subaccountId,
        {
          balance: item.balance ?? 0,
          lastTransactionDate: item.lastTransactionDate ?? new Date(0),
        },
      ]),
    );
  },
);

/**
 * Returns the list of accounts for the user with all of their subaccounts.
 * The total value of the account is calculated by converting all subaccounts' value to the user's main currency.
 *
 * @returns The list of accounts for the user with all of their subaccounts.
 */
export const getAccounts = createAuthenticatedApiQuery<void, Account[]>(async ({ ctx }) => {
  // Set up cache tags
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.accounts);
  cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

  const db = await getDb(ctx.supabaseToken);

  // Get all the data in parallel
  const [accounts, { mainCurrency, mapper: mainCurrencyMapper }, subaccountBalances] =
    await Promise.all([
      db.rls((tx) => tx.query.accounts.findMany({ with: { subaccounts: true } })),
      getMainCurrencyWithMapper.withContext({ ctx }),
      getSubaccountBalances.withContext({ ctx }),
    ]);

  // Map the accounts to the Account type
  return accounts.map((account) =>
    mapAccountData(account, mainCurrency, mainCurrencyMapper, subaccountBalances),
  );
});

/**
 * Returns the account with the specified id, with all of its subaccounts.
 * If the account is not found, returns undefined.
 *
 * @param accountId - The id of the account to get.
 * @returns The account with the specified id, or undefined if it is not found.
 */
export const getAccount = createAuthenticatedApiQuery<string, Account | undefined>(
  async ({ input: accountId, ctx }) => {
    // Set up cache tags
    'use cache';
    cacheTag.id(accountId, CACHE_TAGS.accounts);
    cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

    const db = await getDb(ctx.supabaseToken);

    // Get all the data in parallel
    const [account, { mainCurrency, mapper: mainCurrencyMapper }, subaccountBalances] =
      await Promise.all([
        db.rls((tx) =>
          tx.query.accounts.findFirst({
            where: (table, { eq }) => eq(table.id, accountId),
            with: { subaccounts: true },
          }),
        ),
        getMainCurrencyWithMapper.withContext({ ctx }),
        getSubaccountBalances.withContext({ ctx }),
      ]);

    if (!account) {
      return undefined;
    }

    // Map the account to the Account type
    return mapAccountData(account, mainCurrency, mainCurrencyMapper, subaccountBalances);
  },
);
