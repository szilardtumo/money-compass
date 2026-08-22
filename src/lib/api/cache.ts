import 'server-only';

import {
  cacheLife,
  cacheTag as nextCacheTag,
  revalidateTag as nextRevalidateTag,
} from 'next/cache';

export type ValidTags =
  ReturnType<typeof getGlobalTag> | ReturnType<typeof getUserTag> | ReturnType<typeof getIdTag>;

export const CACHE_TAGS = {
  profiles: 'profiles',
  accounts: 'accounts',
  transactions: 'transactions',
  currencies: 'currencies',
  currencyMappers: 'currencyMappers',
  integrations: 'integrations',
  gocardlessInstitutions: 'gocardlessInstitutions',
} as const;

const getGlobalTag = (tag: keyof typeof CACHE_TAGS) => `global:${CACHE_TAGS[tag]}` as const;
const getUserTag = (userId: string, tag: keyof typeof CACHE_TAGS) =>
  `user:${userId}-${CACHE_TAGS[tag]}` as const;
const getIdTag = (id: string, tag: keyof typeof CACHE_TAGS) =>
  `id:${id}-${CACHE_TAGS[tag]}` as const;

export const cacheTag = (...tags: ValidTags[]) => nextCacheTag(...tags, '*');
cacheTag.global = (...args: Parameters<typeof getGlobalTag>) => cacheTag(getGlobalTag(...args));
cacheTag.user = (...args: Parameters<typeof getUserTag>) => cacheTag(getUserTag(...args));
cacheTag.id = (...args: Parameters<typeof getIdTag>) => cacheTag(getIdTag(...args));

export const revalidateAllTags = () => nextRevalidateTag('*', 'max');
export const revalidateTag = ({
  tag,
  userId,
  id,
}: {
  tag: keyof typeof CACHE_TAGS;
  userId?: string;
  id?: string;
}) => {
  nextRevalidateTag(getGlobalTag(tag), 'max');
  if (userId != null) {
    nextRevalidateTag(getUserTag(userId, tag), 'max');
  }
  if (id != null) {
    nextRevalidateTag(getIdTag(id, tag), 'max');
  }
};

export { cacheLife };
