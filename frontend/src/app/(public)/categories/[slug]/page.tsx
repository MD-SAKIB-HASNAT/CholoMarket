import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { EmptyState, SectionHeading } from '@/components/shared/Bits';
import { ShopCard } from '@/components/shared/Cards';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { CursorList } from '@/components/shared/CursorList';
import { Media } from '@/components/shared/Media';
import { SortSelect } from '@/app/(public)/components/SortSelect';
import { serverApi } from '@/utils/api/api';
import type { Category, CursorPage, ProductCard, Shop } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export async function generateMetadata({
  params,
}: PageProps<'/categories/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const c = await serverApi<Category>(STORE_ENDPOINTS.categories.bySlug(slug));
  return { title: c?.nameEn ?? 'Category' };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<'/categories/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await serverApi<Category>(STORE_ENDPOINTS.categories.bySlug(slug));
  if (!category) notFound();
  const sort = typeof sp.sort === 'string' ? sp.sort : 'newest';
  const query = { categoryId: category.id, sort, limit: 20 };
  const [products, shops] = await Promise.all([
    serverApi<CursorPage<ProductCard>>(STORE_ENDPOINTS.products.list, query),
    serverApi<CursorPage<Shop>>(STORE_ENDPOINTS.shops.list, { categoryId: category.id, limit: 6 }),
  ]);

  return (
    <div className="container-page py-8">
      <div className="relative mb-6 overflow-hidden rounded-md bg-ink">
        <Media
          src={category.imageUrl ?? category.parent?.imageUrl}
          alt=""
          width={1600}
          priority
          className="absolute inset-0 opacity-50"
        />
        <div className="relative px-6 py-10 text-white sm:px-10 sm:py-14">
          {category.parent ? (
            <Link
              href={`/categories/${category.parent.slug}`}
              className="text-sm text-white/80 hover:text-white"
            >
              {category.parent.nameEn}
            </Link>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.nameEn}</h1>
          <p lang="bn" className="text-white/85">
            {category.nameBn}
          </p>
        </div>
      </div>
      {category.children?.length ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {category.children.map(c => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted"
            >
              <CategoryIcon name={c.icon} className="size-3.5" /> {c.nameEn}
            </Link>
          ))}
        </div>
      ) : null}

      {shops?.items.length ? (
        <section className="mb-10">
          <SectionHeading title="Shops selling this" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shops.items.map(s => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeading
          title="Products"
          action={
            <Suspense>
              <SortSelect value={sort} />
            </Suspense>
          }
        />
        <CursorList
          key={JSON.stringify(query)}
          kind="products"
          path={STORE_ENDPOINTS.products.list}
          query={query}
          initial={products}
          empty={
            <EmptyState
              icon={Package}
              title="Nothing here yet"
              description="Shops in this category are still adding products."
            />
          }
        />
      </section>
    </div>
  );
}
