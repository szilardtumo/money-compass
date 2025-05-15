import { GocardlessError } from '@/lib/api/errors';
import { GocardlessInstitution } from '@/lib/types/integrations.types';
import { uniqueBy } from '@/lib/utils/unique-by';

import { getGocardlessClient } from './client';
import {
  GocardlessAmount,
  GocardlessAccountDetails,
  GocardlessRequisition,
  GocardlessTransaction,
} from './types';

const gocardlessCountries = ['HU', 'RO'];

interface GetRequisitionsResponse {
  results: GocardlessRequisition[];
  count: number;
}

async function getInstitutions(): Promise<GocardlessInstitution[]> {
  try {
    const gocardless = await getGocardlessClient();
    const responses = await Promise.all(
      gocardlessCountries.map(
        (country) =>
          gocardless.institution.getInstitutions({ country }) as Promise<GocardlessInstitution[]>,
      ),
    );

    return uniqueBy(responses.flat(), (institution) => institution.id);
  } catch (error) {
    throw new GocardlessError(error);
  }
}

async function getRequisitions(): Promise<GocardlessRequisition[]> {
  try {
    const gocardless = await getGocardlessClient();
    const response = (await gocardless.requisition.getRequisitions()) as GetRequisitionsResponse;

    return response.results;
  } catch (error) {
    throw new GocardlessError(error);
  }
}

async function getRequisition(id: string): Promise<GocardlessRequisition | undefined> {
  try {
    const gocardless = await getGocardlessClient();
    const response = (await gocardless.requisition.getRequisitionById(id)) as
      | GocardlessRequisition
      | undefined;

    return response;
  } catch (error) {
    throw new GocardlessError(error);
  }
}

async function createRequisition(params: {
  institutionId: string;
  redirectUrl: string;
  integrationId: string;
}): Promise<GocardlessRequisition> {
  try {
    const gocardlessClient = await getGocardlessClient();

    return (await gocardlessClient.requisition.createRequisition({
      institutionId: params.institutionId,
      redirectUrl: params.redirectUrl,
      accountSelection: false,
      redirectImmediate: false,
      reference: params.integrationId,
      ssn: '',
    })) as GocardlessRequisition;
  } catch (error) {
    throw new GocardlessError(error);
  }
}

async function deleteRequisition(id: string): Promise<void> {
  try {
    const gocardlessClient = await getGocardlessClient();
    await gocardlessClient.requisition.deleteRequisition(id);
  } catch (error) {
    throw new GocardlessError(error);
  }
}

interface GetAccountDetailsResponse {
  account: GocardlessAccountDetails;
}

async function getAccountDetails(id: string): Promise<GocardlessAccountDetails | undefined> {
  try {
    const gocardlessClient = await getGocardlessClient();
    const response = (await gocardlessClient.account(id).getDetails()) as
      | GetAccountDetailsResponse
      | undefined;

    return response?.account;
  } catch (error) {
    throw new GocardlessError(error);
  }
}

interface GetAccountBalanceResponse {
  balances: {
    balanceAmount: GocardlessAmount;
    balanceType: string;
    referenceDate: string;
  }[];
}

async function getAccountBalance(id: string): Promise<GocardlessAmount | undefined> {
  try {
    const gocardlessClient = await getGocardlessClient();
    const response = (await gocardlessClient.account(id).getBalances()) as
      | GetAccountBalanceResponse
      | undefined;

    return response?.balances?.[0].balanceAmount;
  } catch (error) {
    throw new GocardlessError(error);
  }
}

interface GetTransactionsResponse {
  transactions: {
    booked: GocardlessTransaction[];
    pending?: GocardlessTransaction[];
  };
}

async function getTransactions(accountId: string): Promise<GocardlessTransaction[]> {
  try {
    const gocardlessClient = await getGocardlessClient();
    const response = (await gocardlessClient
      .account(accountId)
      .getTransactions()) as GetTransactionsResponse;

    return [...response.transactions.booked, ...(response.transactions.pending ?? [])];
  } catch (error) {
    throw new GocardlessError(error);
  }
}

export const gocardlessApi = {
  getInstitutions,
  getRequisitions,
  getRequisition,
  createRequisition,
  deleteRequisition,
  getAccountDetails,
  getAccountBalance,
  getTransactions,
};
