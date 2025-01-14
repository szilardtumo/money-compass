import NordigenClient from 'nordigen-node';
import { cache } from 'react';

declare global {
  // eslint-disable-next-line no-var
  var gocardlessClient: NordigenClient | undefined;
}

const gocardlessClient =
  global.gocardlessClient ||
  new NordigenClient({
    secretId: process.env.GOCARDLESS_SECRET_ID!,
    secretKey: process.env.GOCARDLESS_SECRET_KEY!,
    baseUrl: 'https://bankaccountdata.gocardless.com/api/v2',
  });
if (process.env.NODE_ENV !== 'production') global.drizzleClient = drizzleClient;

export const getGocardlessClient = cache(async () => {
  await gocardlessClient.generateToken();

  return gocardlessClient;
});
