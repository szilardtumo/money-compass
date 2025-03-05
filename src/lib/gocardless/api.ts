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
  const gocardless = await getGocardlessClient();
  const responses = await Promise.all(
    gocardlessCountries.map(
      (country) =>
        gocardless.institution.getInstitutions({ country }) as Promise<GocardlessInstitution[]>,
    ),
  );

  return uniqueBy(responses.flat(), (institution) => institution.id);
}

async function getRequisitions(): Promise<GocardlessRequisition[]> {
  const gocardless = await getGocardlessClient();
  const response = (await gocardless.requisition.getRequisitions()) as GetRequisitionsResponse;

  return response.results;
}

async function getRequisition(id: string): Promise<GocardlessRequisition | undefined> {
  const gocardless = await getGocardlessClient();
  const response = (await gocardless.requisition.getRequisitionById(id)) as
    | GocardlessRequisition
    | undefined;

  return response;
}

async function createRequisition(params: {
  institutionId: string;
  redirectUrl: string;
  integrationId: string;
}): Promise<GocardlessRequisition> {
  const gocardlessClient = await getGocardlessClient();

  return (await gocardlessClient.requisition.createRequisition({
    institutionId: params.institutionId,
    redirectUrl: params.redirectUrl,
    accountSelection: false,
    redirectImmediate: false,
    reference: params.integrationId,
    ssn: '',
  })) as GocardlessRequisition;
}

async function deleteRequisition(id: string): Promise<void> {
  const gocardlessClient = await getGocardlessClient();
  await gocardlessClient.requisition.deleteRequisition(id);
}

interface GetAccountDetailsResponse {
  account: GocardlessAccountDetails;
}

async function getAccountDetails(id: string): Promise<GocardlessAccountDetails | undefined> {
  const gocardlessClient = await getGocardlessClient();
  const response = (await gocardlessClient.account(id).getDetails()) as
    | GetAccountDetailsResponse
    | undefined;

  return response?.account;
}

interface GetAccountBalanceResponse {
  balances: {
    balanceAmount: GocardlessAmount;
    balanceType: string;
    referenceDate: string;
  }[];
}

async function getAccountBalance(id: string): Promise<GocardlessAmount | undefined> {
  const gocardlessClient = await getGocardlessClient();
  const response = (await gocardlessClient.account(id).getBalances()) as
    | GetAccountBalanceResponse
    | undefined;

  return response?.balances?.[0].balanceAmount;
}

interface GetTransactionsResponse {
  transactions: {
    booked: GocardlessTransaction[];
    pending?: GocardlessTransaction[];
  };
}

async function getTransactions(accountId: string): Promise<GocardlessTransaction[]> {
  const gocardlessClient = await getGocardlessClient();
  const response = (await gocardlessClient
    .account(accountId)
    .getTransactions()) as GetTransactionsResponse;

  return [...response.transactions.booked, ...(response.transactions.pending ?? [])];
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
