import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EmptyState, SectionHeading } from '@/components/shared/Bits';
import { MarketCard, ProductCard, ShopCard } from '@/components/shared/Cards';
import { serverApi } from '@/utils/api/api';
import type { SearchResult } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export async function generateMetadata({ searchParams }: PageProps<'/search'>): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: typeof q === 'string' && q ? `“${q}”` : 'Search' };
}

const LIST_FOR_SCOPE = { market: '/markets', shop: '/shops', product: '/products' } as const;

/**
 * The quick "everything" search: the best few markets, shops and products for a name, each with a link to
 * its full list (which has its own filters and keeps loading as you scroll).
 */
export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const sp = await searchParams;
  const q = (typeof sp.q === 'string' ? sp.q : '').trim();
  const scope = typeof sp.scope === 'string' ? sp.scope : 'all';
  if (!q) redirect('/products');
  // A single kind is just that kind's list page.
  if (scope in LIST_FOR_SCOPE)
    redirect(`${LIST_FOR_SCOPE[scope as keyof typeof LIST_FOR_SCOPE]}?q=${encodeURIComponent(q)}`);

  const result = await serverApi<SearchResult>(STORE_ENDPOINTS.search.root, { q });
  const encoded = encodeURIComponent(q);

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Results for “{q}”</h1>
      </div>
      {!result?.resultsCount ? (
        <EmptyState
          icon={SearchX}
          title={`Nothing found for “${q}”`}
          description="Try a shorter word, check the spelling, or search in Bangla. We log searches like this to tell shops what customers want."
          className="my-6"
        />
      ) : null}

      {result?.markets?.items.length ? (
        <section className="mb-10">
          <SectionHeading
            title="Malls & markets"
            action={
              result.markets.hasMore ? (
                <Link className="text-sm text-primary" href={`/markets?q=${encoded}`}>
                  See all
                </Link>
              ) : null
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.markets.items.map(m => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
      ) : null}

      {result?.shops?.items.length ? (
        <section className="mb-10">
          <SectionHeading
            title="Shops"
            action={
              result.shops.hasMore ? (
                <Link className="text-sm text-primary" href={`/shops?q=${encoded}`}>
                  See all
                </Link>
              ) : null
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.shops.items.map(s => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </section>
      ) : null}

      {result?.products?.items.length ? (
        <section>
          <SectionHeading
            title="Products"
            action={
              result.products.hasMore ? (
                <Link className="text-sm text-primary" href={`/products?q=${encoded}`}>
                  See all
                </Link>
              ) : null
            }
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {result.products.items.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
