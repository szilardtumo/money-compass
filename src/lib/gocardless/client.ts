import NordigenClient from 'nordigen-node';
import { cache } from 'react';

import { env } from '@/lib/env';

import type { GocardlessError } from './types';

declare global {
  var gocardlessClient: NordigenClient | undefined;
}

const gocardlessClient =
  global.gocardlessClient ||
  new NordigenClient({
    secretId: env.GOCARDLESS_SECRET_ID,
    secretKey: env.GOCARDLESS_SECRET_KEY,
    baseUrl: 'https://bankaccountdata.gocardless.com/api/v2',
  });
if (process.env.NODE_ENV !== 'production') global.gocardlessClient = gocardlessClient;

export const getGocardlessClient = cache(async () => {
  await gocardlessClient.generateToken();

  return gocardlessClient;
});

export const isGocardlessError = (err: unknown): err is GocardlessError => {
  return err instanceof Error && 'response' in err;
};
