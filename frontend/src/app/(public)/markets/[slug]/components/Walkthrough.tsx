'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Footprints, Layers, LayoutGrid, Store, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bn, EmptyState, Rating, VerifiedBadge } from '@/components/shared/Bits';
import { ProductCard, ShopCard } from '@/components/shared/Cards';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { Initials, Media } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { floorLabel } from '@/utils/helpers/format';
import type {
  Directory,
  DirectoryFloor,
  CursorPage,
  Market,
  ProductCard as ProductCardType,
  Shop,
} from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

/** Floor plan with a pin per shop (shops.map_x / map_y are % positions). */
function FloorMap({
  floor,
  active,
  onPick,
}: {
  floor: DirectoryFloor;
  active: number | null;
  onPick: (s: Shop) => void;
}) {
  const placed = floor.shops.filter(s => s.mapX !== null && s.mapY !== null);
  if (!placed.length) return null;
  return (
    <div
      className="relative mb-6 aspect-[16/7] overflow-hidden rounded-md border bg-[linear-gradient(90deg,var(--border)_1px,transparent_1px),linear-gradient(var(--border)_1px,transparent_1px)] bg-[size:40px_40px] bg-muted/30"
      aria-label={`${floor.nameEn} floor plan`}
    >
      <div className="absolute inset-x-[42%] inset-y-0 bg-background/70" aria-hidden />
      <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-background px-2 text-[10px] tracking-wide text-muted-foreground uppercase">
        Walkway
      </span>
      {placed.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          style={{ left: `${s.mapX}%`, top: `${s.mapY}%` }}
          className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2 rounded-md border bg-background px-2 py-1 text-[11px] font-medium shadow-sm transition hover:z-10 hover:scale-110 hover:border-primary',
            active === s.id && 'z-10 scale-110 border-primary bg-primary text-primary-foreground'
          )}
          title={s.nameEn}
        >
          {s.shopNumber ?? s.nameEn.slice(0, 8)}
        </button>
      ))}
    </div>
  );
}

/** "Walk mode": step through the mall shop by shop, seeing each shop's products. */
function WalkMode({
  shops,
  start,
  onExit,
}: {
  shops: (Shop & { floorName: string })[];
  start: number;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(start);
  const shop = shops[index];
  const products = useQuery({
    queryKey: ['products', { shopId: shop.id }],
    queryFn: () =>
      api<CursorPage<ProductCardType>>(STORE_ENDPOINTS.products.list, {
        query: { shopId: shop.id, limit: 12 },
        token: null,
      }),
  });

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Footprints className="size-4 text-primary" /> Shop {index + 1} of {shops.length} ·{' '}
          {shop.floorName}
        </p>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <X /> Exit walk
        </Button>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
          {shop.coverUrl ? (
            <Media src={shop.coverUrl} alt={shop.nameEn} width={300} />
          ) : (
            <Initials name={shop.nameEn} className="size-full text-xl" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-xl font-semibold">{shop.nameEn}</h3>
            {shop.isVerified ? <VerifiedBadge /> : null}
          </div>
          <Bn className="text-sm">{shop.nameBn}</Bn>
          <p className="mt-1 text-sm text-muted-foreground">
            {shop.shopNumber ? `Shop ${shop.shopNumber} · ` : ''}
            {shop.primaryCategory?.nameEn}
          </p>
          <Rating value={shop.ratingAvg} count={shop.ratingCount} className="mt-1" />
        </div>
        <Button variant="outline" render={<Link href={`/shops/${shop.slug}`} />}>
          <Store /> Visit shop page
        </Button>
      </div>
      <div className="border-t p-4">
        {products.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : products.data?.items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {products.data.items.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            This shop hasn’t added products yet.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ArrowLeft /> {index > 0 ? shops[index - 1].nameEn : 'Previous'}
        </Button>
        <Button disabled={index === shops.length - 1} onClick={() => setIndex(index + 1)}>
          {index < shops.length - 1 ? shops[index + 1].nameEn : 'Next'} <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

export function MallWalkthrough({ market, directory }: { market: Market; directory: Directory }) {
  const floors = directory.floors.filter(f => f.shops.length || f.level !== 999);
  const [floorId, setFloorId] = useState<number | 'all'>('all');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [walkFrom, setWalkFrom] = useState<number | null>(null);

  // Category filter uses the API so shops that sell in a secondary category are included.
  const filtered = useQuery({
    queryKey: ['directory', market.slug, categoryId],
    queryFn: () =>
      api<Directory>(STORE_ENDPOINTS.markets.directory(market.slug), {
        query: { categoryId: categoryId ?? undefined },
        token: null,
      }),
    enabled: categoryId !== null,
  });
  const source = categoryId !== null && filtered.data ? filtered.data.floors : floors;
  const visibleFloors = floorId === 'all' ? source : source.filter(f => f.id === floorId);

  // Walking order: floors bottom-up, then walk order within the floor.
  const walkList = useMemo(
    () => source.flatMap(f => f.shops.map(s => ({ ...s, floorName: f.nameEn }))),
    [source]
  );
  const total = walkList.length;

  if (walkFrom !== null && walkList.length) {
    return (
      <WalkMode
        shops={walkList}
        start={Math.min(walkFrom, walkList.length - 1)}
        onExit={() => setWalkFrom(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Walk through the mall</h2>
          <p className="text-sm text-muted-foreground">
            {total} shops across {floors.filter(f => f.level !== 999).length} floors
          </p>
        </div>
        <Button size="lg" onClick={() => setWalkFrom(0)} disabled={!total}>
          <Footprints /> Start walking shop by shop
        </Button>
      </div>

      {market.categories?.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-sm',
              categoryId === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            All categories
          </button>
          {market.categories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm',
                categoryId === c.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <CategoryIcon name={c.icon} className="size-3.5" /> {c.nameEn}
              <span className="text-xs opacity-70">{c.shopCount}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setFloorId('all')}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
            floorId === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          )}
        >
          <LayoutGrid className="size-4" /> All floors
        </button>
        {floors
          .filter(f => f.level !== 999)
          .map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFloorId(f.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
                floorId === f.id ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Layers className="size-4" /> {f.nameEn}
            </button>
          ))}
      </div>

      {visibleFloors.every(f => !f.shops.length) ? (
        <EmptyState
          icon={Store}
          title="No shops match"
          description="Try another category or floor."
        />
      ) : (
        visibleFloors.map(floor =>
          floor.shops.length ? (
            <section key={floor.id} aria-labelledby={`floor-${floor.id}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {floorLabel(floor.level)}
                </span>
                <div>
                  <h3 id={`floor-${floor.id}`} className="font-semibold">
                    {floor.nameEn}
                  </h3>
                  <Bn className="text-xs">{floor.nameBn}</Bn>
                </div>
              </div>
              {floorId !== 'all' ? (
                <FloorMap floor={floor} active={highlight} onPick={s => setHighlight(s.id)} />
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {floor.shops.map(shop => (
                  <div
                    key={shop.id}
                    className={cn(
                      'relative rounded-xl transition',
                      highlight === shop.id && 'ring-2 ring-primary'
                    )}
                  >
                    <ShopCard shop={shop} />
                    <button
                      type="button"
                      onClick={() => setWalkFrom(walkList.findIndex(w => w.id === shop.id))}
                      className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                    >
                      <Footprints className="size-3" /> Walk from here
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        )
      )}
    </div>
  );
}
