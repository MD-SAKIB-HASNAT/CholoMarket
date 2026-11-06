import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/shared/Bits';
import { CursorList } from '@/components/shared/CursorList';
import { ProductFilters } from '@/components/shared/ProductFilters';
import { serverApi } from '@/utils/api/api';
import { formatDistance } from '@/utils/helpers/format';
import { nearbyQuery } from '@/utils/helpers/locationParams';
import type { CursorPage, ProductCard } from '@/utils/types';
import { SortSelect } from '@/app/(public)/components/SortSelect';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export const metadata: Metadata = { title: 'Products' };

const str = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);

/** Step 3: every product. Search by name, filter by category and brand, or tap Nearby for products from shops close to you. */
export default async function ProductsPage({ searchParams }: PageProps<'/products'>) {
  const sp = await searchParams;
  const q = str(sp.q)?.trim();
  const near = nearbyQuery(sp);
  const sort = str(sp.sort);
  const query = {
    q,
    categoryId: str(sp.categoryId),
    brandId: str(sp.brandId),
    negotiable: str(sp.negotiable) === 'true' ? 'true' : undefined,
    sort,
    limit: 20,
    ...near,
  };
  const data = await serverApi<CursorPage<ProductCard>>(STORE_ENDPOINTS.products.list, query);
  const nearby = data?.radiusMeters !== undefined;

  return (
    <div className="container-page py-8">
      <div className="mb-5 space-y-1">
        <p className="text-sm font-medium text-primary">Step 3 of 3</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {q ? `Results for “${q}”` : 'Products'}
        </h1>
        <p className="text-muted-foreground">
          {nearby
            ? `Products from shops within ${formatDistance(data!.radiusMeters!)} of you, nearest first.`
            : 'Open one to see sizes, prices and the shop that has it.'}
        </p>
      </div>
      <Suspense>
        <ProductFilters className="mb-5" />
      </Suspense>
      <div className="mb-4 flex justify-end">
        <Suspense>
          <SortSelect
            value={sort ?? (q ? 'relevance' : nearby ? 'nearest' : 'newest')}
            withRelevance={!!q}
            withNearest={nearby}
          />
        </Suspense>
      </div>
      <CursorList
        key={JSON.stringify(query)}
        kind="products"
        path={STORE_ENDPOINTS.products.list}
        query={query}
        initial={data}
        empty={
          <EmptyState
            icon={SearchX}
            title={
              nearby
                ? 'No products close to you'
                : q
                  ? `Nothing found for “${q}”`
                  : 'No products found'
            }
            description={
              nearby
                ? `No shop within ${formatDistance(data!.radiusMeters!)} has a match. Turn off Nearby or change the filters.`
                : 'Try a shorter word, check the spelling, or search in Bangla. We log searches like this to tell shops what customers want.'
            }
          />
        }
      />
    </div>
  );
}
