import { Building2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/shared/Bits';
import { CursorList } from '@/components/shared/CursorList';
import { LocationFilter } from '@/components/shared/LocationFilter';
import { SearchField } from '@/components/shared/SearchField';
import { serverApi } from '@/utils/api/api';
import { MARKET_KIND_LABEL, formatDistance } from '@/utils/helpers/format';
import { hasLocationFilter, locationQuery } from '@/utils/helpers/locationParams';
import type { CursorPage, Market } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export const metadata: Metadata = { title: 'Malls & markets' };

const str = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);

/** Step 1: every mall and market. Search by name, filter by place, or tap Nearby. */
export default async function MarketsPage({ searchParams }: PageProps<'/markets'>) {
  const sp = await searchParams;
  const kind = str(sp.kind);
  const query = { kind, q: str(sp.q)?.trim(), limit: 24, ...locationQuery(sp) };
  const data = await serverApi<CursorPage<Market>>(STORE_ENDPOINTS.markets.list, query);
  const filtered = hasLocationFilter(sp) || !!query.q;
  const nearby = data?.radiusMeters !== undefined;

  /** The kind chips keep every other filter. */
  const kindHref = (k?: string) => {
    const p = new URLSearchParams();
    for (const [key, v] of Object.entries(sp))
      if (typeof v === 'string' && key !== 'kind') p.set(key, v);
    if (k) p.set('kind', k);
    return `/markets${p.size ? `?${p}` : ''}`;
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium text-primary">Step 1 of 3</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Malls & markets</h1>
        <p lang="bn" className="text-muted-foreground">
          মার্কেট বেছে নিন, তারপর দোকানে দোকানে ঘুরে দেখুন
        </p>
      </div>
      <Suspense>
        <SearchField placeholder="Search a mall or market by name" className="mb-3 max-w-xl" />
        <LocationFilter className="mb-4" />
      </Suspense>
      <div className="mb-6 flex flex-wrap gap-2">
        {[undefined, 'mall', 'market', 'bazaar', 'wholesale_market'].map(k => (
          <Link
            key={k ?? 'all'}
            href={kindHref(k)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm',
              kind === k ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            {k ? MARKET_KIND_LABEL[k] : 'All'}
          </Link>
        ))}
      </div>
      <CursorList
        key={JSON.stringify(query)}
        kind="markets"
        path={STORE_ENDPOINTS.markets.list}
        query={query}
        initial={data}
        empty={
          <EmptyState
            icon={Building2}
            title={
              nearby
                ? 'Nothing close to you yet'
                : filtered
                  ? 'No markets match'
                  : 'No markets here yet'
            }
            description={
              nearby
                ? `No market is within ${formatDistance(data!.radiusMeters!)} of you. Pick a division, district or area instead.`
                : filtered
                  ? 'Try another place or a different name.'
                  : 'We’re onboarding new malls and markets every week.'
            }
          />
        }
      />
    </div>
  );
}
