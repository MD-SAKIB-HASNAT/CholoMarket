'use client';

import { useQuery } from '@tanstack/react-query';
import { Handshake, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api/api';
import type { Brand, CursorPage } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { NativeSelect } from '@/components/shared/FormBits';
import { NEARBY_PARAMS, NearbyToggle } from '@/components/shared/NearbyToggle';
import { SearchField } from '@/components/shared/SearchField';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

/** The filters of the product list; all of them live in the page address. */
const OWN_PARAMS = ['q', 'categoryId', 'brandId', 'negotiable', 'sort', ...NEARBY_PARAMS] as const;

/**
 * Product list filters: search by name, Category, Brand, Nearby and "Open to bargaining".
 * (Sorting sits next to the result count, see SortSelect.)
 */
export function ProductFilters({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const categoryId = params.get('categoryId') ?? '';
  const brandId = params.get('brandId') ?? '';
  const negotiable = params.get('negotiable') === 'true';

  // Brands that have products; narrowed to the chosen category.
  const brands = useQuery({
    queryKey: ['brands', categoryId],
    queryFn: () =>
      api<CursorPage<Brand>>(STORE_ENDPOINTS.brands.list, {
        token: null,
        query: { categoryId, limit: 50 },
      }),
    staleTime: 10 * 60_000,
  });

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}${next.size ? `?${next}` : ''}`);
  };

  const filtered = OWN_PARAMS.some(k => k !== 'sort' && params.get(k));

  return (
    <div className={cn('space-y-3', className)}>
      <SearchField placeholder="Search products by name, e.g. panjabi" className="max-w-xl" />
      <div className="flex flex-wrap items-center gap-2">
        <NearbyToggle kind="products" />
        <CategoryFilter alsoClear={['brandId']} />
        <NativeSelect
          aria-label="Brand"
          value={brandId}
          onChange={e => go({ brandId: e.target.value || null })}
          disabled={!brands.data?.items.length && !brandId}
          className={cn(
            'h-9 w-auto min-w-36 max-w-52 bg-card',
            brandId && 'border-primary text-ink'
          )}
        >
          <option value="">All brands</option>
          {brands.data?.items.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>
        <button
          type="button"
          onClick={() => go({ negotiable: negotiable ? null : 'true' })}
          aria-pressed={negotiable}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
            negotiable ? 'border-bargain bg-bargain text-ink' : 'bg-card hover:border-bargain'
          )}
        >
          <Handshake className="size-4" /> Open to bargaining
        </button>
        {filtered ? (
          <button
            type="button"
            onClick={() => go(Object.fromEntries(OWN_PARAMS.map(k => [k, null])))}
            className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" /> Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
