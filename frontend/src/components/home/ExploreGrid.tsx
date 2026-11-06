'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/shared/Cards';
import { api } from '@/utils/api/api';
import type { CursorPage, ProductCard as ProductCardType } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

const TABS = [
  { sort: 'newest', label: 'Just arrived' },
  { sort: 'rating', label: 'Best rated' },
  { sort: 'discount', label: 'Biggest savings' },
  { sort: 'price_asc', label: 'Under budget' },
] as const;
const PAGE_SIZE = 15;

/** Endless "keep browsing" grid at the bottom of the home page, loaded page by page with cursors. */
export function ExploreGrid({ initial }: { initial: CursorPage<ProductCardType> | null }) {
  const [sort, setSort] = useState<(typeof TABS)[number]['sort']>('newest');
  const feed = useInfiniteQuery({
    queryKey: ['explore', sort],
    queryFn: ({ pageParam }) =>
      api<CursorPage<ProductCardType>>(STORE_ENDPOINTS.products.list, {
        token: null,
        query: { sort, cursor: pageParam, limit: PAGE_SIZE, inStock: true },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    initialData:
      sort === 'newest' && initial ? { pages: [initial], pageParams: [undefined] } : undefined,
  });
  const items = feed.data?.pages.flatMap(p => p.items) ?? [];

  return (
    <section className="container-page">
      <div className="mb-5 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Keep exploring
          </h2>
          <p className="text-sm text-muted-foreground">
            Fresh from every shop on the platform — delivered to your door or ready to collect.
          </p>
        </div>
        <div role="tablist" className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.sort}
              type="button"
              role="tab"
              aria-selected={sort === t.sort}
              onClick={() => setSort(t.sort)}
              className={cn(
                'shrink-0 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                sort === t.sort
                  ? 'bg-ink text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {feed.isPending
          ? Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          : items.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {feed.hasNextPage ? (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-8"
            onClick={() => feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
          >
            {feed.isFetchingNextPage ? <LoaderCircle className="animate-spin" /> : null} Show more
            products
          </Button>
        </div>
      ) : null}
    </section>
  );
}
