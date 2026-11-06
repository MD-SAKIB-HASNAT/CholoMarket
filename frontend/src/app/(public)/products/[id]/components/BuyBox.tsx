'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Handshake,
  Heart,
  LoaderCircle,
  ShoppingCart,
  Store,
  Truck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Price } from '@/components/shared/Bits';
import { Field, QuantityStepper } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { useAuth } from '@/utils/context/AuthContext';
import { formatTaka, timeAgo } from '@/utils/helpers/format';
import type { Cart, CursorPage, Offer, ProductDetail, PublicConfig, Variant } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

/** Groups variant attributes into option rows, e.g. Size: M L XL · Colour: Red Blue. */
function optionsOf(variants: Variant[]) {
  const keys = [...new Set(variants.flatMap(v => Object.keys(v.attributes)))];
  return keys.map(key => ({
    key,
    values: [...new Set(variants.map(v => v.attributes[key]).filter(Boolean))],
  }));
}

export function BuyBox({ product }: { product: ProductDetail }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const variants = product.variants;
  const options = useMemo(() => optionsOf(variants), [variants]);
  const firstAvailable = variants.find(v => v.availableQty > 0) ?? variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(
    firstAvailable?.attributes ?? {}
  );
  const [qty, setQty] = useState(1);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const config = useQuery({
    queryKey: ['config'],
    queryFn: () => api<PublicConfig>(STORE_ENDPOINTS.platform.config, { token: null }),
  });

  const variant =
    variants.find(v => options.every(o => v.attributes[o.key] === selected[o.key])) ??
    (options.length ? undefined : variants[0]);

  const wishlist = useQuery({
    queryKey: ['product', product.id, 'me'],
    queryFn: () => api<ProductDetail>(STORE_ENDPOINTS.products.byId(product.id)),
    enabled: !!user,
    select: p => p.inWishlist,
  });
  // An accepted offer on this variant lets the customer buy at the agreed price.
  const offers = useQuery({
    queryKey: ['offers', 'buy-box'],
    queryFn: () => api<CursorPage<Offer>>(STORE_ENDPOINTS.offers.list, { query: { limit: 50 } }),
    enabled: !!user,
  });
  const acceptedOffer = offers.data?.items.find(
    o =>
      o.variantId === variant?.id && o.status === 'accepted' && new Date(o.expiresAt) > new Date()
  );
  const openOffer = offers.data?.items.find(
    o => o.variantId === variant?.id && (o.status === 'pending' || o.status === 'countered')
  );

  const needLogin = () => router.push(`/login?next=/products/${product.id}`);

  const addToCart = useMutation({
    mutationFn: (opts: { offerId?: number; goToCart?: boolean }) =>
      api<Cart>(STORE_ENDPOINTS.cart.items, {
        method: 'POST',
        body: {
          variantId: variant!.id,
          quantity: opts.offerId ? acceptedOffer!.quantity : qty,
          offerId: opts.offerId,
        },
      }),
    onSuccess: (cart, opts) => {
      qc.setQueryData(['cart'], cart);
      if (opts.goToCart) router.push('/cart');
      else
        toast.success('Added to cart', {
          action: { label: 'View cart', onClick: () => router.push('/cart') },
        });
    },
  });

  const toggleWishlist = useMutation({
    mutationFn: (on: boolean) =>
      api(STORE_ENDPOINTS.wishlist.byProductId(product.id), { method: on ? 'POST' : 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product', product.id, 'me'] }),
  });

  const makeOffer = useMutation({
    mutationFn: () =>
      api<Offer>(STORE_ENDPOINTS.offers.list, {
        method: 'POST',
        body: {
          variantId: variant!.id,
          quantity: qty,
          offeredPrice: Number(offerPrice),
          note: offerNote || undefined,
        },
      }),
    onSuccess: offer => {
      setOfferOpen(false);
      setOfferPrice('');
      void qc.invalidateQueries({ queryKey: ['offers'] });
      if (offer.status === 'rejected')
        toast.error('That’s below what the shop can accept. Try a bit higher.');
      else toast.success('Offer sent! We’ll notify you when the shop replies.');
    },
  });

  const outOfStock = !variant || variant.availableQty <= 0;
  const lowStock =
    variant && variant.availableQty > 0 && variant.availableQty <= variant.lowStockThreshold;

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5">
      <div className="space-y-1">
        <Price
          value={variant?.price ?? product.minPrice}
          compareAt={variant?.compareAtPrice}
          size="lg"
        />
        {product.canMakeOffer ? (
          <p className="text-sm text-amber-700">Price negotiable — make an offer below.</p>
        ) : null}
      </div>

      {options.map(o => (
        <div key={o.key} className="space-y-2">
          <p className="text-sm font-medium capitalize">
            {o.key}: <span className="font-normal text-muted-foreground">{selected[o.key]}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {o.values.map(value => {
              const candidate = variants.find(
                v =>
                  v.attributes[o.key] === value &&
                  options.every(x => x.key === o.key || v.attributes[x.key] === selected[x.key])
              );
              const soldOut = candidate ? candidate.availableQty <= 0 : true;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelected({ ...selected, [o.key]: value });
                    setQty(1);
                  }}
                  className={cn(
                    'min-w-11 rounded-lg border px-3 py-1.5 text-sm transition',
                    selected[o.key] === value
                      ? 'border-primary bg-primary/5 font-medium text-primary'
                      : 'hover:border-foreground/30',
                    soldOut && 'text-muted-foreground line-through'
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <QuantityStepper
          value={qty}
          max={Math.max(1, Math.min(variant?.availableQty ?? 1, 20))}
          onChange={setQty}
          disabled={outOfStock}
        />
        {outOfStock ? (
          <span className="font-medium text-deal">Out of stock</span>
        ) : lowStock ? (
          <span className="font-medium text-amber-700">Only {variant.availableQty} left</span>
        ) : (
          <span className="text-emerald-700">In stock</span>
        )}
        {variant ? (
          <span className="text-xs text-muted-foreground">
            · stock updated {timeAgo(variant.stockUpdatedAt)}
          </span>
        ) : null}
      </div>

      {acceptedOffer ? (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-900">
            Your offer was accepted: {formatTaka(acceptedOffer.finalPrice)} each ×{' '}
            {acceptedOffer.quantity}
          </p>
          <Button
            className="w-full"
            onClick={() => addToCart.mutate({ offerId: acceptedOffer.id, goToCart: true })}
            disabled={addToCart.isPending}
          >
            <Handshake /> Buy at your price
          </Button>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          size="lg"
          className="h-11"
          disabled={outOfStock || addToCart.isPending}
          onClick={() => (user ? addToCart.mutate({}) : needLogin())}
        >
          {addToCart.isPending ? <LoaderCircle className="animate-spin" /> : <ShoppingCart />} Add
          to cart
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-11"
          disabled={outOfStock}
          onClick={() => (user ? addToCart.mutate({ goToCart: true }) : needLogin())}
        >
          <Zap /> Buy now
        </Button>
        {product.canMakeOffer ? (
          openOffer ? (
            <Button
              variant="secondary"
              className="h-10 sm:col-span-2"
              render={<Link href="/offers" />}
            >
              <Handshake /> Offer{' '}
              {openOffer.status === 'countered'
                ? `countered at ${formatTaka(openOffer.counterPrice)} — respond`
                : 'sent, waiting for shop'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="h-10 sm:col-span-2"
              disabled={outOfStock}
              onClick={() => (user ? setOfferOpen(true) : needLogin())}
            >
              <Handshake /> Make an offer
            </Button>
          )
        ) : null}
      </div>

      <ul className="divide-y rounded-md border text-sm">
        {product.shop.offersDelivery !== false ? (
          <li className="flex gap-3 p-3">
            <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="block font-medium">Home delivery by Steadfast</span>
              <span className="block text-xs text-muted-foreground">
                {formatTaka(config.data?.deliveryFeeInsideDhaka ?? 70)} inside Dhaka (1–2 days) ·{' '}
                {formatTaka(config.data?.deliveryFeeOutsideDhaka ?? 130)} outside (2–4 days)
              </span>
            </span>
          </li>
        ) : null}
        {product.shop.acceptsCashOnPickup ? (
          <li className="flex gap-3 p-3">
            <Banknote className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="block font-medium">Cash on delivery available</span>
              <span className="block text-xs text-muted-foreground">
                Or pay now with bKash or Nagad
              </span>
            </span>
          </li>
        ) : null}
        <li className="flex gap-3 p-3">
          <Store className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="block font-medium">
              Free pickup at {product.shop.market?.nameEn ?? 'the shop'}
            </span>
            <span className="block text-xs text-muted-foreground">
              Ready the same day — see it in person before you take it home
            </span>
          </span>
        </li>
      </ul>

      <button
        type="button"
        onClick={() => (user ? toggleWishlist.mutate(!wishlist.data) : needLogin())}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Heart className={cn('size-4', wishlist.data && 'fill-deal text-deal')} />{' '}
        {wishlist.data ? 'Saved to wishlist' : 'Save for later'}
      </button>

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an offer</DialogTitle>
            <DialogDescription>
              Listed at {formatTaka(variant?.price)} each. The shop can accept, counter or decline.
              Accepted prices are held for 48 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Your price per item (৳)" htmlFor="offer-price">
              <Input
                id="offer-price"
                type="number"
                inputMode="numeric"
                min={1}
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                autoFocus
              />
            </Field>
            <p className="text-sm text-muted-foreground">Quantity: {qty}</p>
            <Field label="Note to the shop (optional)" htmlFor="offer-note">
              <Textarea
                id="offer-note"
                value={offerNote}
                onChange={e => setOfferNote(e.target.value)}
                rows={2}
                placeholder="e.g. I’ll pick it up today"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => makeOffer.mutate()}
              disabled={
                !offerPrice || Number(offerPrice) >= (variant?.price ?? 0) || makeOffer.isPending
              }
            >
              Send offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
