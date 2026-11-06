'use client';

import { Banknote, ChevronRight, Inbox, Truck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { formatTaka, timeAgo, timeLeft } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { ShopOrder } from '@/utils/types';
import {
  AddressBlock,
  CodLine,
  DeliveryStatusBadge,
  FulfillmentChip,
  TrackingLink,
} from '@/app/(protected)/portal/shop/[shopId]/components/Delivery';
import { OrderActions } from '@/app/(protected)/portal/shop/[shopId]/components/OrderActions';
import { shopBase, useShopId } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'returned', label: 'Returned' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

export default function ShopOrdersPage() {
  const shopId = useShopId();
  const [status, setStatus] = useState('active');
  const orders = useCursorList<ShopOrder>(
    ['shop', shopId, 'orders', status],
    PORTAL_ENDPOINTS.shop.orders(shopId),
    { status, limit: 20 },
    { refetchInterval: 20_000 }
  );

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Confirm new orders quickly — customers see the status live."
      />
      <Tabs value={status} onValueChange={v => setStatus(String(v))} className="mb-4">
        <div className="overflow-x-auto overflow-y-hidden">
          <TabsList>
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {orders.isPending ? (
        <LoadingBlock />
      ) : orders.isError ? (
        <EmptyState
          icon={Inbox}
          title="Could not load orders"
          description={orders.error?.message}
        />
      ) : !orders.items.length ? (
        <EmptyState
          icon={Inbox}
          title={status === 'active' ? 'No orders waiting' : 'Nothing here yet'}
          description={status === 'active' ? 'New orders appear here automatically.' : undefined}
        />
      ) : (
        <div className="grid gap-3">
          {orders.items.map(so => (
            <ShopOrderCard key={so.id} shopId={shopId} so={so} />
          ))}
          <LoadMore
            hasMore={!!orders.hasMore}
            loading={orders.isLoadingMore}
            onLoad={orders.loadMore}
            auto
            label="Show more orders"
          />
        </div>
      )}
    </div>
  );
}

function ShopOrderCard({ shopId, so }: { shopId: number; so: ShopOrder }) {
  const open = ['placed', 'confirmed', 'ready_for_pickup'].includes(so.status);
  const desk = so.fulfillmentType === 'desk_pickup';
  const delivery = so.fulfillmentType === 'delivery';
  const address = so.order?.deliveryAddress;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`${shopBase(shopId)}/orders/${so.id}`}
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            {so.subOrderNo} <ChevronRight className="size-4" />
          </Link>
          <p className="text-xs text-muted-foreground">
            {timeAgo(so.createdAt)} · {so.order?.contactName}
            {open && !delivery && so.reservedUntil ? ` · held ${timeLeft(so.reservedUntil)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FulfillmentChip so={so} />
          <DeliveryStatusBadge status={so.status} />
        </div>
      </div>
      {delivery && address ? (
        <div className="mt-2">
          <AddressBlock address={address} compact />
        </div>
      ) : null}

      <ul className="mt-3 space-y-1 text-sm">
        {so.items.map(i => (
          <li key={i.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {i.quantity} × {i.productName}
              {i.variantLabel ? (
                <span className="text-muted-foreground"> · {i.variantLabel}</span>
              ) : null}
              {i.offerId ? <span className="ml-1 text-xs text-amber-700">(bargained)</span> : null}
            </span>
            <span className="shrink-0 tabular-nums">{formatTaka(i.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Total {formatTaka(so.total)}</span>
        {delivery ? (
          <>
            {so.deliveryFee > 0 ? <span>+ {formatTaka(so.deliveryFee)} delivery</span> : null}
            <CodLine cashDue={so.cashDue} />
          </>
        ) : so.cashDue > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
            <Banknote className="size-3.5" /> Collect {formatTaka(so.cashDue)} cash
          </span>
        ) : (
          <span className="text-emerald-700">Paid online</span>
        )}
        {so.shipment ? (
          <span className="inline-flex items-center gap-1">
            <Truck className="size-3.5" />
            {so.shipment.courierStatusLabel ?? 'Booked with Steadfast'} ·{' '}
            <TrackingLink shipment={so.shipment} />
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="mt-3">
          <OrderActions
            shopId={shopId}
            shopOrderId={so.id}
            subOrderNo={so.subOrderNo}
            status={so.status}
            cashDue={so.cashDue}
            deskPickup={desk}
            delivery={delivery}
            address={address}
          />
        </div>
      ) : so.cancelReason ? (
        <p className="mt-2 text-xs text-muted-foreground">Reason: {so.cancelReason}</p>
      ) : null}
    </div>
  );
}
