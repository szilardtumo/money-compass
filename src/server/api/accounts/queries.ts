import 'server-only';

import { InferSelectModel } from 'drizzle-orm';

import { createApiContext, createApiQuery } from '@/lib/api';
import { MissingExchangeRateError } from '@/lib/api/errors';
import { Account, Subaccount } from '@/lib/types/accounts.types';
import { schema } from '@/server/db';

import { getMainCurrencyWithMapper } from '../currencies/queries';

type DbAccount = InferSelectModel<(typeof schema)['accounts']> & {
  subaccounts: InferSelectModel<(typeof schema)['subaccounts']>[];
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
export const getSubaccountBalances = createApiQuery<void, SubaccountBalances>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  // Get all the balances
  const balances = await db.rls((tx) => tx.select().from(schema.balances));

  // Map the balances to the desired format
  return Object.fromEntries(
    balances.map((item) => [
      item.subaccountId,
      {
        balance: item.balance,
        lastTransactionDate: item.lastTransactionDate,
      },
    ]),
  );
});

/**
 * Returns the list of accounts for the user with all of their subaccounts.
 * The total value of the account is calculated by converting all subaccounts' value to the user's main currency.
 *
 * @returns The list of accounts for the user with all of their subaccounts.
 */
export const getAccounts = createApiQuery<void, Account[]>(async () => {
  'use cache: private';
  const { db } = await createApiContext();

  // Get all the data in parallel
  const [accounts, { mainCurrency, mapper: mainCurrencyMapper }, subaccountBalances] =
    await Promise.all([
      db.rls((tx) => tx.query.accounts.findMany({ with: { subaccounts: true } })),
      getMainCurrencyWithMapper(),
      getSubaccountBalances(),
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
export const getAccount = createApiQuery<string, Account | undefined>(
  async ({ input: accountId }) => {
    'use cache: private';
    const { db } = await createApiContext();

    // Get all the data in parallel
    const [account, { mainCurrency, mapper: mainCurrencyMapper }, subaccountBalances] =
      await Promise.all([
        db.rls((tx) =>
          tx.query.accounts.findFirst({
            where: (table, { eq }) => eq(table.id, accountId),
            with: { subaccounts: true },
          }),
        ),
        getMainCurrencyWithMapper(),
        getSubaccountBalances(),
      ]);

    if (!account) {
      return undefined;
    }

    // Map the account to the Account type
    return mapAccountData(account, mainCurrency, mainCurrencyMapper, subaccountBalances);
  },
);
