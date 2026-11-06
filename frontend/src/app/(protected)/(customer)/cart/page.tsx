'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Handshake,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bn, EmptyState, VerifiedBadge } from '@/components/shared/Bits';
import { QuantityStepper } from '@/components/shared/FormBits';
import { Media } from '@/components/shared/Media';
import { useCart } from '@/components/site/Header';
import { api } from '@/utils/api/api';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { formatTaka, plural } from '@/utils/helpers/format';
import type { Cart } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export default function CartPage() {
  const { user } = useRequireAuth();
  const qc = useQueryClient();
  const cart = useCart();

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      api<Cart>(STORE_ENDPOINTS.cart.itemById(id), { method: 'PATCH', body: { quantity } }),
    onSuccess: c => qc.setQueryData(['cart'], c),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api<Cart>(STORE_ENDPOINTS.cart.itemById(id), { method: 'DELETE' }),
    onSuccess: c => qc.setQueryData(['cart'], c),
  });

  if (!user || cart.isPending) {
    return (
      <div className="container-page grid gap-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const data = cart.data;
  if (!data?.groups.length) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Walk through a mall and add items from as many shops as you like — you’ll pick them all up in one trip."
          action={<Button render={<Link href="/markets" />}>Explore malls</Button>}
        />
      </div>
    );
  }

  const hasIssues = data.groups.some(g => g.items.some(i => i.issues.length));

  return (
    <div className="container-page py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Your cart</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {plural(data.itemCount, 'item')} from {plural(data.groups.length, 'shop')} — each shop
        prepares its part for pickup.
      </p>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {data.groups.map(g => (
            <section key={g.shop.id} className="rounded-xl border bg-card">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <Link
                    href={`/shops/${g.shop.slug}`}
                    className="inline-flex items-center gap-1 font-medium hover:text-primary"
                  >
                    {g.shop.nameEn} {g.shop.isVerified ? <VerifiedBadge /> : null}
                  </Link>
                  {g.shop.market ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="size-3" /> {g.shop.market.nameEn}
                      {g.shop.shopNumber ? ` · Shop ${g.shop.shopNumber}` : ''}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-medium tabular-nums">{formatTaka(g.subtotal)}</p>
              </header>
              <ul className="divide-y">
                {g.items.map(item => (
                  <li key={item.id} className="flex gap-3 p-4">
                    <Link
                      href={`/products/${item.productId}`}
                      className="size-20 shrink-0 overflow-hidden rounded-lg border"
                    >
                      <Media src={item.imageUrl} alt={item.productName} seed={item.productName} />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/products/${item.productId}`}
                        className="line-clamp-2 text-sm font-medium hover:text-primary"
                      >
                        {item.productName}
                      </Link>
                      {item.productNameBn ? (
                        <Bn className="block text-xs">{item.productNameBn}</Bn>
                      ) : null}
                      {item.variantLabel ? (
                        <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                      ) : null}
                      <p className="text-sm tabular-nums">
                        {formatTaka(item.unitPrice)}
                        {item.offerId ? (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 text-xs text-emerald-800">
                            <Handshake className="size-3" /> bargained (was{' '}
                            {formatTaka(item.listPrice)})
                          </span>
                        ) : null}
                      </p>
                      {item.issues.map(issue => (
                        <p key={issue} className="flex items-center gap-1 text-xs text-deal">
                          <AlertTriangle className="size-3" /> {issue}
                        </p>
                      ))}
                      <div className="flex items-center gap-3 pt-1">
                        <QuantityStepper
                          value={item.quantity}
                          max={Math.max(item.quantity, Math.min(item.availableQty, 20))}
                          onChange={quantity => update.mutate({ id: item.id, quantity })}
                          disabled={update.isPending || !!item.offerId}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove.mutate(item.id)}
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 /> Remove
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium tabular-nums">{formatTaka(item.lineTotal)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <aside className="h-fit space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({plural(data.itemCount, 'item')})
            </span>
            <span className="tabular-nums">{formatTaka(data.subtotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Coupons, pickup options and payment are chosen at checkout. No delivery charge — you
            collect in person.
          </p>
          {hasIssues ? (
            <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              Fix the highlighted items before checking out.
            </p>
          ) : null}
          <Button
            size="lg"
            className="h-11 w-full"
            disabled={hasIssues}
            render={hasIssues ? undefined : <Link href="/checkout" />}
          >
            Checkout <ArrowRight />
          </Button>
        </aside>
      </div>
    </div>
  );
}
