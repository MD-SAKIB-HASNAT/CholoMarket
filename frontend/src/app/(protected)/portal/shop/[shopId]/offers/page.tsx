'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Handshake, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { api } from '@/utils/api/api';
import { formatTaka, timeAgo, timeLeft } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Offer } from '@/utils/types';
import {
  shopBase,
  useShopId,
  useShopRole,
} from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

const TABS = [
  { value: 'pending', label: 'New' },
  { value: 'countered', label: 'Countered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'all', label: 'All' },
];

export default function ShopOffersPage() {
  const shopId = useShopId();
  const [tab, setTab] = useState('pending');
  const { canManage } = useShopRole(shopId);
  const offers = useCursorList<Offer>(
    ['shop', shopId, 'offers', tab],
    PORTAL_ENDPOINTS.shop.offers(shopId),
    { status: tab === 'all' ? undefined : tab, limit: 20 },
    { refetchInterval: 20_000 }
  );

  return (
    <div>
      <PageHeader
        title="Price offers"
        description="Customers bargain here. Reply fast — open offers expire after 24 hours."
      />
      <Tabs value={tab} onValueChange={v => setTab(String(v))} className="mb-4">
        <TabsList>
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {offers.isPending ? (
        <LoadingBlock />
      ) : offers.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Could not load offers"
          description={offers.error?.message}
        />
      ) : !offers.items.length ? (
        <EmptyState
          icon={Handshake}
          title="No offers here"
          description="Turn on “Allow bargaining” for products where you’re happy to negotiate."
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {offers.items.map(o => (
              <OfferCard key={o.id} shopId={shopId} offer={o} canRespond={canManage} />
            ))}
          </div>
          <LoadMore
            hasMore={!!offers.hasMore}
            loading={offers.isLoadingMore}
            onLoad={offers.loadMore}
            label="Show more offers"
          />
        </>
      )}
    </div>
  );
}

function OfferCard({
  shopId,
  offer,
  canRespond,
}: {
  shopId: number;
  offer: Offer;
  canRespond: boolean;
}) {
  const qc = useQueryClient();
  const [counterOpen, setCounterOpen] = useState(false);
  const [counter, setCounter] = useState('');
  const below = Math.round(((offer.listPrice - offer.offeredPrice) / offer.listPrice) * 100);

  const respond = useMutation({
    mutationFn: (body: { action: 'accept' | 'reject' | 'counter'; counterPrice?: number }) =>
      api<Offer>(PORTAL_ENDPOINTS.shop.offerRespond(shopId, offer.id), { method: 'POST', body }),
    onSuccess: (_d, body) => {
      toast.success(
        body.action === 'accept'
          ? 'Offer accepted'
          : body.action === 'counter'
            ? 'Counter-offer sent'
            : 'Offer declined'
      );
      setCounterOpen(false);
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });

  const counterNum = Number(counter);
  const counterValid =
    counter !== '' && counterNum > offer.offeredPrice && counterNum < offer.listPrice;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`${shopBase(shopId)}/products/${offer.productId}`}
            className="font-medium hover:underline"
          >
            {offer.productName}
          </Link>
          <p className="text-xs text-muted-foreground">
            {offer.variantLabel ?? 'Default'} · qty {offer.quantity} · {timeAgo(offer.createdAt)}
          </p>
        </div>
        <StatusBadge status={offer.status} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Listed</p>
          <p className="tabular-nums">{formatTaka(offer.listPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Offered</p>
          <p className="font-semibold tabular-nums">{formatTaka(offer.offeredPrice)}</p>
          <p className="text-[11px] text-deal">{below}% below</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {offer.finalPrice ? 'Agreed' : 'Your counter'}
          </p>
          <p className="tabular-nums">{formatTaka(offer.finalPrice ?? offer.counterPrice)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {offer.customer?.fullName ?? 'Customer'}
          {offer.customer?.noShowCount ? (
            <span className="ml-1 text-amber-700">
              · {offer.customer.noShowCount} missed pickup
              {offer.customer.noShowCount > 1 ? 's' : ''}
            </span>
          ) : null}
        </span>
        {['pending', 'countered', 'accepted'].includes(offer.status) ? (
          <span>{timeLeft(offer.expiresAt)}</span>
        ) : null}
      </div>
      {offer.status === 'pending' && canRespond ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={respond.isPending}
            onClick={() => respond.mutate({ action: 'accept' })}
          >
            <Check /> Accept {formatTaka(offer.offeredPrice)}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={respond.isPending}
            onClick={() => setCounterOpen(true)}
          >
            Counter
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={respond.isPending}
            onClick={() => respond.mutate({ action: 'reject' })}
          >
            <X /> Decline
          </Button>
        </div>
      ) : null}

      <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counter-offer</DialogTitle>
            <DialogDescription>
              Pick a price between {formatTaka(offer.offeredPrice)} and{' '}
              {formatTaka(offer.listPrice)} per item.
            </DialogDescription>
          </DialogHeader>
          <Input
            inputMode="decimal"
            autoFocus
            value={counter}
            onChange={e => setCounter(e.target.value)}
            placeholder={String(Math.round((offer.offeredPrice + offer.listPrice) / 2))}
            aria-label="Counter price"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!counterValid || respond.isPending}
              onClick={() => respond.mutate({ action: 'counter', counterPrice: counterNum })}
            >
              Send counter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
