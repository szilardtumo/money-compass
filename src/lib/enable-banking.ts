import 'server-only';

import { format } from 'date-fns';
import { createSign } from 'node:crypto';

import { env } from '@/lib/env';
import { Institution } from '@/lib/types/integrations.types';

// https://enablebanking.com/docs/api/reference/
const API_URL = 'https://api.enablebanking.com';

interface Amount {
  amount: string;
  currency: string;
}

interface Account {
  uid: string;
  identification_hash: string;
  account_id?: { iban?: string };
  name?: string;
  details?: string;
  product?: string;
  currency: string;
}

interface Transaction {
  entry_reference?: string;
  transaction_id?: string;
  transaction_amount: Amount;
  credit_debit_indicator: 'CRDT' | 'DBIT';
  booking_date?: string;
  value_date?: string;
  transaction_date?: string;
  creditor?: { name?: string };
  debtor?: { name?: string };
  remittance_information?: string[];
}

export class EnableBankingError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'EnableBankingError';
  }
}

function createJwt() {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = `${encode({ typ: 'JWT', alg: 'RS256', kid: env.ENABLE_BANKING_APP_ID })}.${encode(
    {
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      iat: now,
      exp: now + 3600,
    },
  )}`;
  const signature = createSign('RSA-SHA256')
    .update(payload)
    .sign(env.ENABLE_BANKING_PRIVATE_KEY, 'base64url');

  return `${payload}.${signature}`;
}

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${createJwt()}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  // Error responses from proxies and empty DELETE responses aren't JSON
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new EnableBankingError(
      `Enable Banking ${method} ${path.split('?')[0]} failed: ${data.message ?? response.statusText}`,
      data.error,
    );
  }

  return data;
}

export async function getInstitutions(): Promise<Institution[]> {
  const { aspsps } = await request<{
    aspsps: { name: string; country: string; logo: string; maximum_consent_validity: number }[];
  }>('GET', '/aspsps?psu_type=personal&service=AIS');

  return aspsps.map((aspsp) => ({
    name: aspsp.name,
    country: aspsp.country,
    logoUrl: aspsp.logo,
    maxConsentSeconds: aspsp.maximum_consent_validity,
  }));
}

/**
 * Starts the authorization at the bank.
 *
 * @returns The URL of the bank's page, which redirects to `redirectUrl` with a `code` and the `state`.
 */
export async function startAuthorization(params: {
  institution: { name: string; country: string };
  validUntil: Date;
  state: string;
  redirectUrl: string;
}) {
  const { url } = await request<{ url: string }>('POST', '/auth', {
    access: { valid_until: params.validUntil.toISOString() },
    aspsp: params.institution,
    state: params.state,
    redirect_url: params.redirectUrl,
    psu_type: 'personal',
  });

  return url;
}

export async function createSession(code: string) {
  const session = await request<{
    session_id: string;
    accounts: Account[];
    aspsp: { name: string; country: string };
    access: { valid_until: string };
  }>('POST', '/sessions', { code });

  return {
    id: session.session_id,
    expiresAt: new Date(session.access.valid_until),
    institution: { name: session.aspsp.name, country: session.aspsp.country },
    accounts: session.accounts.map((account) => ({
      externalId: account.uid,
      identificationHash: account.identification_hash,
      name: account.details || account.product || account.name || '',
      iban: account.account_id?.iban ?? null,
      currency: account.currency.toLowerCase(),
    })),
  };
}

export async function deleteSession(sessionId: string) {
  await request('DELETE', `/sessions/${sessionId}`);
}

/**
 * Returns the booked balance of the account. It matches the sum of the booked transactions, while
 * an available balance can include pending transactions and the credit limit.
 */
export async function getBalance(accountId: string) {
  const { balances } = await request<{
    balances: { balance_amount: Amount; balance_type: string }[];
  }>('GET', `/accounts/${accountId}/balances`);
  const balance = ['ITBD', 'CLBD', 'XPCD', 'ITAV', 'CLAV']
    .map((type) => balances.find((item) => item.balance_type === type))
    .find(Boolean);

  if (!balance) {
    throw new EnableBankingError(`No balance returned for account ${accountId}`);
  }

  return Number(balance.balance_amount.amount);
}

/**
 * Returns the booked transactions of the account since `dateFrom`, following all result pages.
 */
export async function getTransactions(accountId: string, dateFrom: Date) {
  const transactions: Transaction[] = [];
  let continuationKey: string | undefined;

  do {
    const params = new URLSearchParams({
      date_from: format(dateFrom, 'yyyy-MM-dd'),
      transaction_status: 'BOOK',
      ...(continuationKey && { continuation_key: continuationKey }),
    });
    const page = await request<{ transactions: Transaction[]; continuation_key?: string }>(
      'GET',
      `/accounts/${accountId}/transactions?${params}`,
    );

    transactions.push(...page.transactions);
    continuationKey = page.continuation_key;
  } while (continuationKey);

  return transactions.map((transaction) => {
    const isDebit = transaction.credit_debit_indicator === 'DBIT';
    // The docs don't say whether amounts are signed, so the sign comes from the indicator
    const amount = Math.abs(Number(transaction.transaction_amount.amount));

    return {
      externalRef: transaction.entry_reference ?? transaction.transaction_id ?? null,
      amount: isDebit ? -amount : amount,
      date: new Date(
        transaction.booking_date ?? transaction.value_date ?? transaction.transaction_date!,
      ),
      description: transaction.remittance_information?.join(' ') ?? '',
      counterpartyName: (isDebit ? transaction.creditor?.name : transaction.debtor?.name) ?? '',
    };
  });
}
