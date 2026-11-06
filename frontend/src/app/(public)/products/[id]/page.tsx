import { Building2, ShieldCheck, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bn, Rating, SectionHeading } from '@/components/shared/Bits';
import { ProductCard, ShopCard } from '@/components/shared/Cards';
import { RecentlyViewed, TrackProductView } from '@/components/home/RecentlyViewed';
import { serverApi } from '@/utils/api/api';
import { humanize, timeAgo } from '@/utils/helpers/format';
import type { CursorPage, ProductDetail, Review } from '@/utils/types';
import { BuyBox } from './components/BuyBox';
import { Gallery } from './components/Gallery';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export async function generateMetadata({ params }: PageProps<'/products/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const p = await serverApi<ProductDetail>(STORE_ENDPOINTS.products.byId(id));
  return {
    title: p ? `${p.nameEn} — ${p.shop.nameEn}` : 'Product',
    description: p?.description ?? undefined,
  };
}

export default async function ProductPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [product, reviews] = await Promise.all([
    serverApi<ProductDetail>(STORE_ENDPOINTS.products.byId(id)),
    serverApi<CursorPage<Review>>(STORE_ENDPOINTS.reviews.list, { productId: id, limit: 10 }),
  ]);
  if (!product) notFound();
  const card = {
    id: product.id,
    slug: product.slug,
    nameEn: product.nameEn,
    nameBn: product.nameBn,
    minPrice: product.minPrice,
    compareAtPrice: Math.max(0, ...product.variants.map(v => v.compareAtPrice ?? 0)) || null,
    isNegotiable: product.isNegotiable,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    imageUrl: [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? null,
    inStock: product.variants.some(v => v.availableQty > 0),
    category: {
      id: product.category.id,
      slug: product.category.slug,
      nameEn: product.category.nameEn,
      icon: product.category.icon,
    },
    shop: {
      id: product.shop.id,
      slug: product.shop.slug,
      nameEn: product.shop.nameEn,
      isVerified: product.shop.isVerified,
      market: product.shop.market ?? null,
    },
  };

  return (
    <div className="container-page py-6">
      <nav
        className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        {product.shop.market ? (
          <>
            <Link href={`/markets/${product.shop.market.slug}`} className="hover:text-foreground">
              {product.shop.market.nameEn}
            </Link>
            <span>/</span>
          </>
        ) : null}
        <Link href={`/shops/${product.shop.slug}`} className="hover:text-foreground">
          {product.shop.nameEn}
        </Link>
        <span>/</span>
        <span aria-current="page" className="truncate text-foreground">
          {product.nameEn}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <Gallery
          images={product.images}
          name={product.nameEn}
          icon={product.category.icon}
          seed={product.slug}
        />
        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{product.nameEn}</h1>
            <Bn className="text-lg">{product.nameBn}</Bn>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
              <Rating value={product.ratingAvg} count={product.ratingCount} className="text-sm" />
              {product.condition !== 'new' ? (
                <span className="rounded bg-muted px-1.5 text-xs">
                  {humanize(product.condition)}
                </span>
              ) : null}
              {product.brand ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Tag className="size-3.5" /> {product.brand.name}
                </span>
              ) : null}
            </div>
          </div>

          <BuyBox product={product} />

          {product.warrantyType !== 'none' ? (
            <p className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              <ShieldCheck className="size-4" />
              {product.warrantyMonths ? `${product.warrantyMonths}-month ` : ''}
              {product.warrantyType === 'brand_official'
                ? 'official brand warranty'
                : 'shop warranty'}
            </p>
          ) : null}

          <div className="rounded-xl border p-1">
            <ShopCard shop={product.shop} className="border-0" />
            {product.shop.market ? (
              <Link
                href={`/markets/${product.shop.market.slug}`}
                className="flex items-center gap-2 border-t px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Building2 className="size-4" /> See other shops in {product.shop.market.nameEn}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {product.description ? (
            <section>
              <SectionHeading title="About this item" />
              <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
            </section>
          ) : null}
          {product.sizeChart ? (
            <section>
              <SectionHeading title="Size guide" subtitle={product.sizeChart.name} />
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {product.sizeChart.chart.columns.map(c => (
                        <th key={c} className="px-3 py-2 text-left font-medium">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizeChart.chart.rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
          <section>
            <SectionHeading title="Reviews" subtitle="From customers who bought this item" />
            {reviews?.items.length ? (
              <div className="space-y-3">
                {reviews.items.map(r => (
                  <div key={r.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <Rating value={r.rating} count={1} />
                      <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    </div>
                    {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">— {r.author}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
          </section>
        </div>
      </div>

      {product.related.length ? (
        <section className="mt-12">
          <SectionHeading title="Similar items in other shops" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {product.related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
      <RecentlyViewed excludeId={product.id} title="You looked at these too" className="mt-12" />
      <TrackProductView product={card} />
    </div>
  );
}
