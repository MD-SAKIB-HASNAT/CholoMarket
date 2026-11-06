'use client';

import { History } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { ProductCard } from '@/components/shared/Cards';
import type { ProductCard as ProductCardType } from '@/utils/types';

const KEY = 'cm-recently-viewed';
const MAX = 10;
const EVENT = 'cm-recently-viewed';

// Cached snapshot so useSyncExternalStore gets a stable value between changes.
let cachedRaw: string | null = null;
let cached: ProductCardType[] = [];

function read(): ProductCardType[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cached;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as ProductCardType[]) : [];
    } catch {
      cached = [];
    }
  }
  return cached;
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const EMPTY: ProductCardType[] = [];

/** Remembers a product page visit (this browser only). */
export function TrackProductView({ product }: { product: ProductCardType }) {
  useEffect(() => {
    try {
      const next = [product, ...read().filter(p => p.id !== product.id)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // storage blocked: nothing to remember
    }
  }, [product]);
  return null;
}

/** "Pick up where you left off": products this browser looked at recently. */
export function RecentlyViewed({
  excludeId,
  title = 'Recently viewed',
  className = 'container-page',
}: {
  excludeId?: number;
  title?: string;
  className?: string;
}) {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY).filter(p => p.id !== excludeId);
  if (items.length < 2) return null;
  return (
    <section className={className}>
      <div className="mb-4 flex items-center gap-2 border-b pb-3">
        <History className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      </div>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        {items.map(p => (
          <ProductCard key={p.id} product={p} className="w-36 shrink-0 snap-start sm:w-44" />
        ))}
      </div>
    </section>
  );
}
