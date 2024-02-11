import { createServerComponentClient as createServerComponentClientInternal } from '@supabase/auth-helpers-nextjs';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';
import { cookies } from 'next/headers';

function createFetch(options: Pick<RequestInit, 'next' | 'cache'>) {
  return (url: RequestInfo | URL, init?: RequestInit) => {
    return fetch(url, {
      ...init,
      ...options,
    });
  };
}

export function createServerComponentClient(fetchOptions: Pick<RequestInit, 'next' | 'cache'>) {
  return createServerComponentClientInternal(
    { cookies },
    {
      options: {
        global: {
          // @ts-ignore
          fetch: createFetch(fetchOptions),
        },
      },
    },
  );
}
