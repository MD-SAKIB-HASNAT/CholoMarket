import { Store } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/shared/Bits';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { CursorList } from '@/components/shared/CursorList';
import { LocationFilter } from '@/components/shared/LocationFilter';
import { SearchField } from '@/components/shared/SearchField';
import { serverApi } from '@/utils/api/api';
import { formatDistance } from '@/utils/helpers/format';
import { hasLocationFilter, locationQuery } from '@/utils/helpers/locationParams';
import type { CursorPage, Shop } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export const metadata: Metadata = { title: 'Shops' };

const str = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);

/** Step 2: every shop. Search by name, filter by category or place, or tap Nearby. */
export default async function ShopsPage({ searchParams }: PageProps<'/shops'>) {
  const sp = await searchParams;
  const verified = str(sp.verified) === 'true';
  const query = {
    q: str(sp.q)?.trim(),
    categoryId: str(sp.categoryId),
    verified: verified || undefined,
    limit: 24,
    ...locationQuery(sp),
  };
  const data = await serverApi<CursorPage<Shop>>(STORE_ENDPOINTS.shops.list, query);
  const filtered = hasLocationFilter(sp) || !!query.q || !!query.categoryId || verified;
  const nearby = data?.radiusMeters !== undefined;

  const verifiedHref = (() => {
    const p = new URLSearchParams();
    for (const [key, v] of Object.entries(sp))
      if (typeof v === 'string' && key !== 'verified') p.set(key, v);
    if (!verified) p.set('verified', 'true');
    return `/shops${p.size ? `?${p}` : ''}`;
  })();

  return (
    <div className="container-page py-8">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium text-primary">Step 2 of 3</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Shops</h1>
        <p className="text-muted-foreground">
          {nearby
            ? `Shops within ${formatDistance(data!.radiusMeters!)} of you, nearest first.`
            : 'Open a shop to see what it has in stock.'}
        </p>
      </div>
      <Suspense>
        <SearchField placeholder="Search a shop by name" className="mb-3 max-w-xl" />
        <LocationFilter className="mb-4" kind="shops" />
      </Suspense>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Suspense>
          <CategoryFilter />
        </Suspense>
        <Link
          href={verifiedHref}
          className={cn(
            'inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium',
            verified ? 'border-sky-600 bg-sky-600 text-white' : 'bg-card hover:border-sky-600'
          )}
        >
          Verified only
        </Link>
      </div>
      <CursorList
        key={JSON.stringify(query)}
        kind="shops"
        path={STORE_ENDPOINTS.shops.list}
        query={query}
        initial={data}
        empty={
          <EmptyState
            icon={Store}
            title={nearby ? 'No shops close to you' : filtered ? 'No shops match' : 'No shops yet'}
            description={
              nearby
                ? `No shop is within ${formatDistance(data!.radiusMeters!)} of you. Try a division, district or area instead.`
                : filtered
                  ? 'Try another place, category or name.'
                  : 'Shops are joining every week.'
            }
          />
        }
      />
    </div>
  );
}
