import 'server-only';

import { CACHE_TAGS, cacheTag } from '@/lib/cache';
import { Account, Subaccount } from '@/lib/types/accounts.types';
import { createAuthenticatedApiQuery } from '@/server/api/create-api-query';
import { getDb, schema } from '@/server/db';

import { getMainCurrencyWithMapper } from './currencies.queries';

export const getSubaccountBalances = createAuthenticatedApiQuery<
  void,
  Record<string, { balance: number; lastTransactionDate: Date }>
>(async ({ ctx }) => {
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.accounts);
  cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

  const db = await getDb(ctx.supabaseToken);

  const balances = await db.rls((tx) => tx.select().from(schema.balances));

  return Object.fromEntries(
    balances.map((item) => [
      item.subaccountId,
      { balance: item.balance ?? 0, lastTransactionDate: item.lastTransactionDate ?? new Date(0) },
    ]),
  );
});

/**
 * Returns the list of accounts with all of their subaccounts.
 * The total value of the account is calculated by converting all subaccounts' value to the user's main currency.
 *
 * @returns
 */
export const getAccounts = createAuthenticatedApiQuery<void, Account[]>(async ({ ctx }) => {
  'use cache';
  cacheTag.user(ctx.userId, CACHE_TAGS.accounts);
  cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

  const db = await getDb(ctx.supabaseToken);

  const [accounts, { mainCurrency, mapper: mainCurrencyMapper }, subaccountBalances] =
    await Promise.all([
      db.rls((tx) => tx.query.accounts.findMany({ with: { subaccounts: true } })),
      getMainCurrencyWithMapper.withContext({ ctx }),
      getSubaccountBalances.withContext({ ctx }),
    ]);

  return accounts.map((account) => {
    const subaccounts = account.subaccounts.map(
      (subaccount) =>
        ({
          id: subaccount.id,
          name: subaccount.name,
          originalCurrency: subaccount.currency,
          mainCurrency,
          balance: {
            originalValue: subaccountBalances[subaccount.id]?.balance ?? 0,
            mainCurrencyValue:
              (subaccountBalances[subaccount.id]?.balance ?? 0) *
              mainCurrencyMapper[subaccount.currency],
          },
          accountId: account.id,
        }) satisfies Subaccount,
    );

    return {
      id: account.id,
      name: account.name,
      category: account.category,
      mainCurrency,
      totalBalance: subaccounts.reduce(
        (acc, current) => acc + current.balance.mainCurrencyValue,
        0,
      ),
      subaccounts,
    };
  });
});

/**
 * Returns the account with the specified id, with all of its subaccounts.
 *
 * @returns
 */
export const getAccount = createAuthenticatedApiQuery<string, Account | undefined>(
  async ({ input: accountId, ctx }) => {
    'use cache';
    cacheTag.id(accountId, CACHE_TAGS.accounts);
    cacheTag.user(ctx.userId, CACHE_TAGS.transactions);

    const db = await getDb(ctx.supabaseToken);

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

    const subaccounts = account.subaccounts.map(
      (subaccount) =>
        ({
          id: subaccount.id,
          name: subaccount.name,
          originalCurrency: subaccount.currency,
          mainCurrency,
          balance: {
            originalValue: subaccountBalances[subaccount.id]?.balance ?? 0,
            mainCurrencyValue:
              (subaccountBalances[subaccount.id]?.balance ?? 0) *
              mainCurrencyMapper[subaccount.currency],
          },
          accountId: account.id,
        }) satisfies Subaccount,
    );

    return {
      id: account.id,
      name: account.name,
      category: account.category,
      mainCurrency,
      totalBalance: subaccounts.reduce(
        (acc, current) => acc + current.balance.mainCurrencyValue,
        0,
      ),
      subaccounts,
    };
  },
);
