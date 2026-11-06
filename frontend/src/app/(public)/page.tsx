import {
  ArrowRight,
  Banknote,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  Store,
  TrendingDown,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { ExploreGrid } from '@/components/home/ExploreGrid';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import { MarketCard, ProductCard, ShopCard } from '@/components/shared/Cards';
import { Media } from '@/components/shared/Media';
import { serverApi } from '@/utils/api/api';
import type {
  Banner,
  CursorPage,
  Market,
  ProductCard as ProductCardType,
  Shop,
  Stats,
} from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

const POPULAR = [
  'Panjabi',
  'Saree',
  'Three-piece',
  'Sneakers',
  'Earbuds',
  'Smartphone',
  'Gold ring',
  'Sunscreen',
  'Abaya',
  'Kids dress',
];

const HOW = [
  {
    icon: Search,
    title: 'Order from any shop',
    text: 'Items from different shops go in one cart and one checkout.',
  },
  {
    icon: Truck,
    title: 'Delivered or ready to collect',
    text: 'Steadfast brings it to your door, or pick it up at the mall the same day.',
  },
  {
    icon: Banknote,
    title: 'Pay the way you like',
    text: 'Cash on delivery, cash at the counter, bKash or Nagad.',
  },
];

function SectionHead({
  title,
  text,
  href,
  linkLabel,
  icon,
}: {
  title: string;
  text: string;
  href?: string;
  linkLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {icon}
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:pb-1"
        >
          {linkLabel} <ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

const hours = (t: string | null) => (t ? t.slice(0, 5) : null);

/** The chevron outline of each journey step: pointed on the right, notched on the left (flat at the ends). */
const CHEVRON = 'polygon(0 0, calc(100% - 26px) 0, 100% 50%, calc(100% - 26px) 100%, 0 100%)';
const CHEVRON_MID =
  'polygon(0 0, calc(100% - 26px) 0, 100% 50%, calc(100% - 26px) 100%, 0 100%, 26px 50%)';
const CHEVRON_LAST = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 26px 50%)';

export default async function HomePage() {
  const [banners, markets, shops, newest, deals, stats] = await Promise.all([
    serverApi<Banner[]>(STORE_ENDPOINTS.banners.list, { placement: 'home_banner' }).catch(
      () => null
    ),
    serverApi<CursorPage<Market>>(STORE_ENDPOINTS.markets.list, { limit: 8 }),
    serverApi<CursorPage<Shop>>(STORE_ENDPOINTS.shops.list, { limit: 6 }),
    serverApi<CursorPage<ProductCardType>>(STORE_ENDPOINTS.products.list, {
      limit: 15,
      sort: 'newest',
      inStock: true,
    }),
    serverApi<CursorPage<ProductCardType>>(STORE_ENDPOINTS.products.list, {
      limit: 12,
      sort: 'discount',
      onSale: true,
      inStock: true,
    }),
    serverApi<Stats>(STORE_ENDPOINTS.stats.root).catch(() => null),
  ]);

  // Spotlight: the first partner mall, with a few of its products.
  const spotlight = markets?.items.find(m => m.isPartner) ?? markets?.items[0];
  const spotlightProducts = spotlight
    ? await serverApi<CursorPage<ProductCardType>>(STORE_ENDPOINTS.products.list, {
        marketId: spotlight.id,
        limit: 4,
        sort: 'rating',
        inStock: true,
      })
    : null;

  const entries = [
    {
      title: 'Malls & markets',
      text: `${stats?.markets ?? 'Many'} to explore, floor by floor`,
      href: '/markets',
    },
    { title: 'Shops', text: `${stats?.shops ?? 'Many'} shops, ready to browse`, href: '/shops' },
    {
      title: 'Products',
      text: `${stats?.products ?? 'Lots'} to order, delivered or collected`,
      href: '/products',
    },
  ];

  return (
    <div className="space-y-14 pb-4">
      <section className="container-page pt-6 sm:pt-8">
        {banners?.length ? <BannerCarousel banners={banners} /> : null}

        <h1 className="sr-only">Cholo Market: malls and markets of Bangladesh, online</h1>

        <ol className="mt-8 grid gap-2 md:flex md:gap-0">
          {entries.map((e, i) => {
            const clip = i === 0 ? CHEVRON : i === entries.length - 1 ? CHEVRON_LAST : CHEVRON_MID;
            return (
              <li key={e.title} className={cn('md:flex-1', i > 0 && 'md:-ml-5')}>
                <Link
                  href={e.href}
                  style={{ '--clip': clip } as React.CSSProperties}
                  className={cn(
                    'group flex h-full items-center gap-4 rounded-md bg-surface px-5 py-4 transition-colors hover:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-24 md:rounded-none md:pr-12 md:[clip-path:var(--clip)]',
                    i > 0 && 'md:pl-11',
                    i === entries.length - 1 && 'md:pr-6'
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-colors group-hover:bg-white group-hover:text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold text-ink transition-colors group-hover:text-white">
                      {e.title}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground transition-colors group-hover:text-white/80">
                      {e.text}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground group-hover:text-white md:hidden" />
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 text-muted-foreground">People are looking for</span>
          {POPULAR.map(q => (
            <Link
              key={q}
              href={`/products?q=${encodeURIComponent(q)}`}
              className="rounded-full border bg-card px-3 py-1 hover:border-primary hover:text-primary"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>

      {markets?.items.length ? (
        <section className="container-page">
          <SectionHead
            title="Choose a mall"
            text="Every floor and every shop, in walking order."
            href="/markets"
            linkLabel="All malls & markets"
          />
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {markets.items.map(m => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
      ) : null}

      {shops?.items.length ? (
        <section className="container-page">
          <SectionHead
            title="Step into a shop"
            text="Verified shops first: trade licence checked and visited by our team."
            href="/shops"
            linkLabel="All shops"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shops.items.map(s => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </section>
      ) : null}

      {deals?.items.length ? (
        <section className="container-page">
          <SectionHead
            icon={<TrendingDown className="size-5 text-deal" />}
            title="Price drops in the shops"
            text="Shops cut these prices this week. Scroll for more."
            href="/products?sort=discount"
            linkLabel="See all deals"
          />
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
            {deals.items.map(p => (
              <ProductCard key={p.id} product={p} className="w-40 shrink-0 snap-start sm:w-48" />
            ))}
          </div>
        </section>
      ) : null}

      {spotlight ? (
        <section className="container-page">
          <div className="grid overflow-hidden rounded-md border bg-card lg:grid-cols-[1.1fr_1fr]">
            <Link href={`/markets/${spotlight.slug}`} className="group relative min-h-72 bg-ink">
              <Media
                src={spotlight.coverUrl}
                alt={spotlight.nameEn}
                width={1200}
                className="absolute inset-0 transition duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-white">
                <span className="rounded-sm bg-bargain px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink uppercase">
                  Mall of the week
                </span>
                <p className="text-2xl font-semibold sm:text-3xl">{spotlight.nameEn}</p>
                {spotlight.description ? (
                  <p className="max-w-md text-sm text-white/85">{spotlight.description}</p>
                ) : null}
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80">
                  {spotlight.area ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {spotlight.area.nameEn}
                    </span>
                  ) : null}
                  {spotlight.shopCount ? (
                    <span className="flex items-center gap-1">
                      <Store className="size-3.5" /> {spotlight.shopCount} shops
                    </span>
                  ) : null}
                  {spotlight.opensAt ? (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {hours(spotlight.opensAt)}–
                      {hours(spotlight.closesAt)}
                    </span>
                  ) : null}
                </p>
              </div>
            </Link>
            <div className="p-5 sm:p-6">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                Top rated inside {spotlight.nameEn}
              </p>
              {spotlightProducts?.items.length ? (
                <div className="grid grid-cols-2 gap-4">
                  {spotlightProducts.items.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : null}
              <Button
                className="mt-5 w-full"
                variant="outline"
                render={<Link href={`/markets/${spotlight.slug}`} />}
              >
                Walk through {spotlight.nameEn} <ArrowRight />
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <RecentlyViewed title="Pick up where you left off" />

      <section className="border-y bg-surface">
        <div className="container-page py-8">
          <p className="mb-5 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            How ordering works
          </p>
          <ul className="grid gap-6 sm:grid-cols-3">
            {HOW.map(s => (
              <li key={s.title} className="flex gap-3">
                <s.icon className="mt-0.5 size-6 shrink-0 text-primary" strokeWidth={1.75} />
                <span>
                  <span className="block font-medium text-ink">{s.title}</span>
                  <span className="block text-sm text-muted-foreground">{s.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ExploreGrid initial={newest} />

      <section className="container-page">
        <div className="relative overflow-hidden rounded-md bg-ink">
          <Media
            src="https://images.unsplash.com/photo-1783309529305-603762ff3cca?auto=format&fit=crop&w=1600&q=80"
            alt=""
            width={1600}
            className="absolute inset-0 opacity-35"
          />
          <div className="relative flex flex-col gap-4 p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-xl space-y-2">
              <p className="text-2xl font-semibold">Have a shop in a mall or market?</p>
              <p className="text-white/85">
                Listing is free for the first three months. Our team photographs your stock and sets
                up the shop; you take orders from your phone and hand parcels to Steadfast with one
                tap.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="h-11 rounded-sm px-5"
              render={<Link href="/login" />}
            >
              List your shop <ArrowRight />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
