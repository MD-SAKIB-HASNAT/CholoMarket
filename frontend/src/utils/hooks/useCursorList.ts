'use client';

import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { api, type Query } from '@/utils/api/api';
import type { CursorPage } from '@/utils/types';

/**
 * A cursor-paged list from the API, loaded one page at a time.
 *   const list = useCursorList<Order>(["orders"], "/orders", { limit: 20 })
 *   list.items, list.hasMore, list.loadMore(), list.isPending (first page), list.isLoadingMore
 * The filters in `query` become part of the cache key, so changing them starts the list over.
 * Every response is `{ items, nextCursor, hasMore }`; `nextCursor` is sent back as `?cursor=`.
 */
export function useCursorList<T>(
  key: QueryKey,
  path: string,
  query: Query = {},
  options: { enabled?: boolean; refetchInterval?: number } = {}
) {
  const feed = useInfiniteQuery({
    queryKey: [...key, query],
    queryFn: ({ pageParam }) =>
      api<CursorPage<T> & Record<string, unknown>>(path, {
        query: { ...query, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    ...options,
  });
  const pages = feed.data?.pages ?? [];
  return {
    items: pages.flatMap(p => p.items),
    /** Anything else the endpoint adds next to `items` (e.g. `unread` on notifications), from the newest page loaded. */
    meta: pages.at(-1) as (CursorPage<T> & Record<string, unknown>) | undefined,
    isPending: feed.isPending,
    isError: feed.isError,
    error: feed.error,
    hasMore: feed.hasNextPage,
    isLoadingMore: feed.isFetchingNextPage,
    isRefetching: feed.isRefetching,
    loadMore: () => feed.fetchNextPage(),
    refetch: () => feed.refetch(),
  };
}
