import { Layers, MapPin, Navigation, Store } from 'lucide-react';
import Link from 'next/link';
import {
  MARKET_KIND_LABEL,
  floorLabel,
  formatDistance,
  locationLabel,
} from '@/utils/helpers/format';
import type { Market, ProductCard as ProductCardType, Shop } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { Bn, Price, Rating, VerifiedBadge } from '@/components/shared/Bits';
import { Initials, Media } from '@/components/shared/Media';

function DistanceTag({ meters }: { meters: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium text-primary">
      <Navigation className="size-3" /> {formatDistance(meters)} away
    </span>
  );
}

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardType;
  className?: string;
}) {
  const off =
    product.compareAtPrice && product.minPrice && product.compareAtPrice > product.minPrice
      ? Math.round(((product.compareAtPrice - product.minPrice) / product.compareAtPrice) * 100)
      : 0;
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn('group flex flex-col focus-visible:outline-none', className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted ring-ring/50 group-focus-visible:ring-3">
        <Media
          src={product.imageUrl}
          alt={product.nameEn}
          width={500}
          className="transition duration-300 group-hover:scale-[1.03]"
        />
        {off ? (
          <span className="absolute top-2 left-2 rounded-sm bg-deal px-1.5 py-0.5 text-[11px] font-semibold text-white">
            −{off}%
          </span>
        ) : null}
        {product.isNegotiable ? (
          <span className="absolute bottom-2 left-2 rounded-sm bg-bargain px-1.5 py-0.5 text-[11px] font-semibold text-ink">
            Bargain
          </span>
        ) : null}
        {!product.inStock ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-xs font-medium text-white">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pt-2.5">
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <span className="truncate">{product.shop.nameEn}</span>
          {product.shop.isVerified ? <VerifiedBadge className="size-3.5" /> : null}
        </p>
        <p className="line-clamp-2 text-sm leading-snug group-hover:underline">{product.nameEn}</p>
        <Price
          value={product.minPrice}
          compareAt={product.compareAtPrice}
          className="mt-1"
          hidePercent
        />
        {product.ratingCount ? (
          <Rating value={product.ratingAvg} count={product.ratingCount} />
        ) : null}
      </div>
    </Link>
  );
}

/** Horizontal shop row: storefront photo, name, where to find it. */
export function ShopCard({ shop, className }: { shop: Shop; className?: string }) {
  return (
    <Link
      href={`/shops/${shop.slug}`}
      className={cn(
        'group flex gap-3 rounded-md border bg-card p-2.5 transition hover:border-foreground/25',
        className
      )}
    >
      <div className="h-[72px] w-24 shrink-0 overflow-hidden rounded-sm bg-muted">
        {shop.coverUrl || shop.logoUrl ? (
          <Media src={shop.logoUrl ?? shop.coverUrl} alt={shop.nameEn} width={240} />
        ) : (
          <Initials name={shop.nameEn} className="size-full rounded-sm text-lg" />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-1">
          <p className="truncate font-medium group-hover:underline">{shop.nameEn}</p>
          {shop.isVerified ? <VerifiedBadge /> : null}
        </div>
        {shop.nameBn ? <Bn className="block truncate text-xs">{shop.nameBn}</Bn> : null}
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
          {shop.primaryCategory ? <span>{shop.primaryCategory.nameEn}</span> : null}
          {shop.floor ? (
            <span className="inline-flex items-center gap-1">
              <Layers className="size-3" /> {floorLabel(shop.floor.level)}
              {shop.shopNumber ? ` · ${shop.shopNumber}` : ''}
            </span>
          ) : null}
          {shop.market ? <span className="truncate">{shop.market.nameEn}</span> : null}
          {shop.distanceMeters !== undefined ? <DistanceTag meters={shop.distanceMeters} /> : null}
        </p>
        {shop.ratingCount ? (
          <Rating value={shop.ratingAvg} count={shop.ratingCount} className="mt-1" />
        ) : null}
      </div>
    </Link>
  );
}

export function MarketCard({ market, className }: { market: Market; className?: string }) {
  return (
    <Link href={`/markets/${market.slug}`} className={cn('group flex flex-col', className)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted">
        <Media
          src={market.coverUrl}
          alt={market.nameEn}
          width={700}
          className="transition duration-300 group-hover:scale-[1.03]"
        />
        {market.isPartner ? (
          <span className="absolute top-2 left-2 rounded-sm bg-white/95 px-1.5 py-0.5 text-[11px] font-medium text-ink">
            Official partner
          </span>
        ) : null}
        {market.distanceMeters !== undefined ? (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-sm bg-primary px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground">
            <Navigation className="size-3" /> {formatDistance(market.distanceMeters)} away
          </span>
        ) : null}
      </div>
      <div className="pt-3">
        <p className="font-semibold group-hover:underline">{market.nameEn}</p>
        <Bn className="text-sm">{market.nameBn}</Bn>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {locationLabel(market) || market.addressLine}
          </span>
          <span>{MARKET_KIND_LABEL[market.kind]}</span>
          {market.shopCount !== undefined ? (
            <span className="inline-flex items-center gap-1">
              <Store className="size-3" /> {market.shopCount} shops
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
