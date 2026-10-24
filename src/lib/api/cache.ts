import 'server-only';

import {
  cacheLife,
  cacheTag as nextCacheTag,
  revalidateTag as nextRevalidateTag,
  updateTag as nextUpdateTag,
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
interface TagOptions {
  tag: keyof typeof CACHE_TAGS;
  userId?: string;
  id?: string;
}

const getTags = ({ tag, userId, id }: TagOptions) => [
  getGlobalTag(tag),
  ...(userId != null ? [getUserTag(userId, tag)] : []),
  ...(id != null ? [getIdTag(id, tag)] : []),
];

/**
 * Expires the tagged data immediately, so the user sees their own changes. Only works in Server Actions.
 */
export const updateTag = (options: TagOptions) => getTags(options).forEach(nextUpdateTag);

/**
 * Revalidates the tagged data outside Server Actions. By default, stale data is served while it refreshes.
 */
export const revalidateTag = (
  options: TagOptions,
  profile: Parameters<typeof nextRevalidateTag>[1] = 'max',
) => getTags(options).forEach((tag) => nextRevalidateTag(tag, profile));

export { cacheLife };
