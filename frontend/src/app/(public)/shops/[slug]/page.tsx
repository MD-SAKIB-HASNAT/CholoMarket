import {
  Banknote,
  Building2,
  Clock,
  Handshake,
  Layers,
  Package,
  Phone,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bn, EmptyState, Rating, SectionHeading, VerifiedBadge } from '@/components/shared/Bits';
import { CursorList } from '@/components/shared/CursorList';
import { Initials, Media } from '@/components/shared/Media';
import { serverApi } from '@/utils/api/api';
import { WEEKDAYS, floorLabel, formatPhone, formatTime, timeAgo } from '@/utils/helpers/format';
import type { CursorPage, ProductCard, Review, ShopDetail } from '@/utils/types';
import { ShopActions } from './components/ShopActions';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export async function generateMetadata({ params }: PageProps<'/shops/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const shop = await serverApi<ShopDetail>(STORE_ENDPOINTS.shops.bySlug(slug));
  return {
    title: shop ? `${shop.nameEn}${shop.market ? ` · ${shop.market.nameEn}` : ''}` : 'Shop',
  };
}

export default async function ShopPage({ params, searchParams }: PageProps<'/shops/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;
  const shop = await serverApi<ShopDetail>(STORE_ENDPOINTS.shops.bySlug(slug));
  if (!shop) notFound();
  const categoryId = typeof sp.categoryId === 'string' ? sp.categoryId : undefined;
  const productQuery = { shopId: shop.id, categoryId, limit: 24 };
  const [products, reviews] = await Promise.all([
    serverApi<CursorPage<ProductCard>>(STORE_ENDPOINTS.products.list, productQuery),
    serverApi<CursorPage<Review>>(STORE_ENDPOINTS.reviews.list, { shopId: shop.id, limit: 6 }),
  ]);

  return (
    <div>
      <section className="relative h-44 overflow-hidden bg-muted sm:h-64">
        <Media src={shop.coverUrl} alt={`${shop.nameEn} storefront`} width={1800} priority />
      </section>
      <div className="container-page">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="size-24 shrink-0 overflow-hidden rounded-md border-4 border-background bg-background">
            {shop.logoUrl ? (
              <Media src={shop.logoUrl} alt={shop.nameEn} />
            ) : (
              <Initials name={shop.nameEn} className="size-full border-0 text-2xl" />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{shop.nameEn}</h1>
              {shop.isVerified ? <VerifiedBadge withText /> : null}
            </div>
            <Bn className="text-base">{shop.nameBn}</Bn>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {shop.market ? (
                <Link
                  href={`/markets/${shop.market.slug}`}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Building2 className="size-4" /> {shop.market.nameEn}
                </Link>
              ) : null}
              {shop.floor ? (
                <span className="inline-flex items-center gap-1">
                  <Layers className="size-4" /> {shop.floor.nameEn} ({floorLabel(shop.floor.level)})
                  {shop.shopNumber ? ` · Shop ${shop.shopNumber}` : ''}
                </span>
              ) : null}
              <Rating value={shop.ratingAvg} count={shop.ratingCount} className="text-sm" />
              <span>{shop.followerCount} followers</span>
            </div>
          </div>
          <ShopActions shopId={shop.id} shopSlug={shop.slug} initialFollowing={shop.isFollowing} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-10">
            <section>
              <SectionHeading title="Products" />
              {shop.categories.length > 1 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  <Link
                    href={`/shops/${shop.slug}`}
                    className={`rounded-full border px-3 py-1 text-sm ${!categoryId ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  >
                    All
                  </Link>
                  {shop.categories.map(c => (
                    <Link
                      key={c.id}
                      href={`/shops/${shop.slug}?categoryId=${c.id}`}
                      className={`rounded-full border px-3 py-1 text-sm ${categoryId === String(c.id) ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      {c.nameEn}
                    </Link>
                  ))}
                </div>
              ) : null}
              <CursorList
                key={JSON.stringify(productQuery)}
                kind="products"
                path={STORE_ENDPOINTS.products.list}
                query={productQuery}
                initial={products}
                gridClassName="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                empty={
                  <EmptyState
                    icon={Package}
                    title="No products yet"
                    description="This shop is still adding its catalogue."
                  />
                }
              />
            </section>

            <section>
              <SectionHeading
                title="Customer reviews"
                subtitle="Only from customers who completed an order"
              />
              {reviews?.items.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {reviews.items.map(r => (
                    <div key={r.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <Rating value={r.rating} count={1} />
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                      {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">— {r.author}</p>
                      {r.shopReply ? (
                        <p className="mt-3 rounded-lg bg-muted p-2 text-xs">
                          <span className="font-medium">Shop replied:</span> {r.shopReply}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </section>
          </div>

          <aside className="space-y-4 text-sm lg:sticky lg:top-24 lg:self-start">
            {shop.description ? (
              <p className="rounded-xl border bg-card p-4 text-muted-foreground">
                {shop.description}
              </p>
            ) : null}
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <p className="font-medium">How buying works here</p>
              <p className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" /> Pickup orders are kept
                ready for {shop.reservationHours} hours.
              </p>
              {shop.acceptsCashOnPickup ? (
                <p className="flex gap-2">
                  <Banknote className="mt-0.5 size-4 shrink-0 text-primary" /> Pay cash at pickup
                  {shop.depositPercent > 0 ? ` (${shop.depositPercent}% deposit online)` : ''}, or
                  bKash/Nagad.
                </p>
              ) : (
                <p className="flex gap-2">
                  <Banknote className="mt-0.5 size-4 shrink-0 text-primary" /> bKash or Nagad
                  payment required.
                </p>
              )}
              {shop.acceptsOffers ? (
                <p className="flex gap-2">
                  <Handshake className="mt-0.5 size-4 shrink-0 text-primary" /> Bargaining welcome
                  on marked items.
                </p>
              ) : null}
              <p className="flex gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
                {shop.returnWindowDays}-day returns. {shop.returnPolicy}
              </p>
              {shop.warrantyPolicy ? (
                <p className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
                  {shop.warrantyPolicy}
                </p>
              ) : null}
              {shop.phone ? (
                <p className="flex gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
                  {formatPhone(shop.phone)}
                </p>
              ) : null}
            </div>
            {shop.hours.length ? (
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-2 font-medium">Opening hours</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {shop.hours.map(h => (
                    <div key={h.weekday} className="contents">
                      <dt className="text-muted-foreground">{WEEKDAYS[h.weekday]}</dt>
                      <dd className="text-right">
                        {h.isClosed ? (
                          <span className="text-deal">Closed</span>
                        ) : (
                          `${formatTime(h.opensAt)} – ${formatTime(h.closesAt)}`
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
