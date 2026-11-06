'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { api, type Query } from '@/utils/api/api';
import type { CursorPage, Market, ProductCard as ProductCardType, Shop } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { MarketCard, ProductCard, ShopCard } from '@/components/shared/Cards';
import { LoadMore } from '@/components/shared/LoadMore';

const KINDS = {
  markets: {
    grid: 'grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4',
    noun: 'market',
    render: (m: Market) => <MarketCard market={m} />,
  },
  shops: {
    grid: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
    noun: 'shop',
    render: (s: Shop) => <ShopCard shop={s} />,
  },
  products: {
    grid: 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5',
    noun: 'product',
    render: (p: ProductCardType) => <ProductCard product={p} />,
  },
};
type Kind = keyof typeof KINDS;
type Item = Market | Shop | ProductCardType;

/**
 * A list that grows as you scroll: the first page comes from the server (so it is in the HTML), the next
 * pages are fetched with the cursor each response carries. A "Show more" button is there too, for people who
 * do not scroll. Pass a different `key` when the filters change so the list starts over.
 */
export function CursorList({
  kind,
  path,
  query,
  initial,
  empty,
  gridClassName,
}: {
  kind: Kind;
  path: string;
  query: Query;
  initial: CursorPage<Item> | null;
  empty: ReactNode;
  gridClassName?: string;
}) {
  const config = KINDS[kind];
  const feed = useInfiniteQuery({
    queryKey: ['cursor-list', path, query],
    queryFn: ({ pageParam }) =>
      api<CursorPage<Item>>(path, { token: null, query: { ...query, cursor: pageParam } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    initialData: initial ? { pages: [initial], pageParams: [undefined] } : undefined,
    staleTime: 60_000,
  });
  const items = feed.data?.pages.flatMap(p => p.items) ?? [];

  if (!items.length && !feed.isFetching) return <>{empty}</>;

  return (
    <div>
      <div className={cn(config.grid, gridClassName)}>
        {items.map(item => (
          <div key={item.id} className="contents">
            {(config.render as (i: Item) => ReactNode)(item)}
          </div>
        ))}
      </div>
      <LoadMore
        hasMore={!!feed.hasNextPage}
        loading={feed.isFetchingNextPage}
        onLoad={() => void feed.fetchNextPage()}
        auto
        label={`Show more ${config.noun}s`}
        className="mt-8 flex justify-center"
      />
      {!feed.hasNextPage && items.length > 12 ? (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          That’s all {items.length} {config.noun}s.
        </p>
      ) : null}
    </div>
  );
}
