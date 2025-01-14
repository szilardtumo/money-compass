import {
  revalidateTag as nextRevalidateTag,
  unstable_cacheTag as nextCacheTag,
  unstable_cacheLife as cacheLife,
} from 'next/cache';

export type ValidTags =
  | ReturnType<typeof getGlobalTag>
  | ReturnType<typeof getUserTag>
  | ReturnType<typeof getIdTag>;

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

export const revalidateAllTags = () => nextRevalidateTag('*');
export const revalidateTag = ({
  tag,
  userId,
  id,
}: {
  tag: keyof typeof CACHE_TAGS;
  userId?: string;
  id?: string;
}) => {
  nextRevalidateTag(getGlobalTag(tag));
  if (userId != null) {
    nextRevalidateTag(getUserTag(userId, tag));
  }
  if (id != null) {
    nextRevalidateTag(getIdTag(id, tag));
  }
};

export { cacheLife };
