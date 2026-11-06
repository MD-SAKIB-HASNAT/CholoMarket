'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Handshake, MessageCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { Media } from '@/components/shared/Media';
import { LoadingBlock } from '@/components/dashboard/DashboardShell';
import { api } from '@/utils/api/api';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { formatTaka, timeAgo, timeLeft } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Cart, Offer } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export default function OffersPage() {
  const { user } = useRequireAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const offers = useCursorList<Offer>(
    ['offers'],
    STORE_ENDPOINTS.offers.list,
    { limit: 20 },
    { enabled: !!user, refetchInterval: 20_000 }
  );

  const respond = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: number;
      action: 'accept_counter' | 'decline_counter' | 'withdraw';
    }) => api<Offer>(STORE_ENDPOINTS.offers.respond(id), { method: 'POST', body: { action } }),
    onSuccess: o => {
      void qc.invalidateQueries({ queryKey: ['offers'] });
      toast.success(
        o.status === 'accepted'
          ? 'Deal! Add it to your cart and order it at this price.'
          : 'Offer updated'
      );
    },
  });
  const buy = useMutation({
    mutationFn: (o: Offer) =>
      api<Cart>(STORE_ENDPOINTS.cart.items, {
        method: 'POST',
        body: { variantId: o.variantId, quantity: o.quantity, offerId: o.id },
      }),
    onSuccess: cart => {
      qc.setQueryData(['cart'], cart);
      router.push('/cart');
    },
  });

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">My offers</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Bargain like in the market — shops accept, counter or decline.
      </p>
      {offers.isPending ? (
        <LoadingBlock />
      ) : !offers.items.length ? (
        <EmptyState
          icon={Handshake}
          title="No offers yet"
          description="Look for the “Bargain” tag on products and tap “Make an offer”."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {offers.items.map(o => (
              <li
                key={o.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row"
              >
                <Link
                  href={`/products/${o.productId}`}
                  className="size-20 shrink-0 overflow-hidden rounded-lg border"
                >
                  <Media src={o.imageUrl} alt={o.productName} seed={o.productName} />
                </Link>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/products/${o.productId}`}
                      className="font-medium hover:text-primary"
                    >
                      {o.productName}
                    </Link>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {o.variantLabel ? `${o.variantLabel} · ` : ''}
                    {o.quantity} item(s) at{' '}
                    <Link href={`/shops/${o.shop?.slug}`} className="hover:underline">
                      {o.shop?.nameEn}
                    </Link>{' '}
                    · {timeAgo(o.createdAt)}
                  </p>
                  <p className="text-sm">
                    Listed{' '}
                    <span className="text-muted-foreground line-through">
                      {formatTaka(o.listPrice)}
                    </span>{' '}
                    · You offered <strong>{formatTaka(o.offeredPrice)}</strong>
                    {o.counterPrice ? (
                      <>
                        {' '}
                        · Shop countered{' '}
                        <strong className="text-violet-700">{formatTaka(o.counterPrice)}</strong>
                      </>
                    ) : null}
                  </p>
                  {['pending', 'countered', 'accepted'].includes(o.status) ? (
                    <p className="text-xs text-amber-700">{timeLeft(o.expiresAt)}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-start gap-2 sm:flex-col sm:items-end">
                  {o.status === 'countered' ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => respond.mutate({ id: o.id, action: 'accept_counter' })}
                      >
                        Accept {formatTaka(o.counterPrice)}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respond.mutate({ id: o.id, action: 'decline_counter' })}
                      >
                        Decline
                      </Button>
                    </>
                  ) : null}
                  {o.status === 'accepted' ? (
                    <Button size="sm" onClick={() => buy.mutate(o)} disabled={buy.isPending}>
                      <ShoppingCart /> Buy at {formatTaka(o.finalPrice)}
                    </Button>
                  ) : null}
                  {o.status === 'pending' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => respond.mutate({ id: o.id, action: 'withdraw' })}
                    >
                      Withdraw
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    render={<Link href={`/messages?c=${o.conversationId}`} />}
                  >
                    <MessageCircle /> Chat
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <LoadMore
            hasMore={!!offers.hasMore}
            loading={offers.isLoadingMore}
            onLoad={offers.loadMore}
            label="Show older offers"
          />
        </>
      )}
    </div>
  );
}
