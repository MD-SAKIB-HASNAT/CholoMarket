'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Banknote, Building2, Phone, Store } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { Media } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { formatDate, formatPhone, formatTaka, humanize, timeLeft } from '@/utils/helpers/format';
import type { Order, ShopOrder } from '@/utils/types';
import {
  AddressBlock,
  CodLine,
  DeliveryStatusBadge,
  FulfillmentChip,
  ShipmentCard,
} from '@/app/(protected)/portal/shop/[shopId]/components/Delivery';
import { OrderActions } from '@/app/(protected)/portal/shop/[shopId]/components/OrderActions';
import { shopBase, useShopId } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

type Detail = ShopOrder & {
  order: Order;
  customer: { id: number; fullName: string; phone: string; noShowCount: number };
};

export default function ShopOrderDetailPage() {
  const shopId = useShopId();
  const { id } = useParams<{ id: string }>();
  const {
    data: so,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['shop', shopId, 'orders', 'detail', id],
    queryFn: () => api<Detail>(PORTAL_ENDPOINTS.shop.order(shopId, id)),
    refetchInterval: 20_000,
  });

  const back = (
    <Button variant="ghost" size="sm" render={<Link href={`${shopBase(shopId)}/orders`} />}>
      <ArrowLeft /> All orders
    </Button>
  );

  if (isLoading) return <LoadingBlock rows={5} />;
  if (isError || !so)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Order not found"
        description={error?.message}
        action={back}
      />
    );

  const open = ['placed', 'confirmed', 'ready_for_pickup'].includes(so.status);
  const desk = so.fulfillmentType === 'desk_pickup';
  const delivery = so.fulfillmentType === 'delivery';
  const address = so.order.deliveryAddress;

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        title={so.subOrderNo}
        description={`Placed ${formatDate(so.createdAt, true)}${open && !delivery && so.reservedUntil ? ` · held for ${timeLeft(so.reservedUntil)}` : ''}`}
        actions={
          <>
            <FulfillmentChip so={so} />
            <DeliveryStatusBadge status={so.status} className="text-sm" />
          </>
        }
      />

      {open ? (
        <Panel>
          <OrderActions
            shopId={shopId}
            shopOrderId={so.id}
            subOrderNo={so.subOrderNo}
            status={so.status}
            cashDue={so.cashDue}
            deskPickup={desk}
            delivery={delivery}
            address={address}
            size="default"
          />
          {delivery && so.status === 'placed' ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Confirm to tell the customer you’re packing it, or send it with Steadfast straight
              away.
            </p>
          ) : null}
        </Panel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Items" className="lg:col-span-2">
          <ul className="divide-y">
            {so.items.map(i => (
              <li key={i.id} className="flex gap-3 py-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg border">
                  <Media src={i.imageUrl} alt={i.productName} seed={i.productName} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {[i.variantLabel, i.sku && `SKU ${i.sku}`].filter(Boolean).join(' · ') ||
                      'Default'}
                  </p>
                  {i.offerId ? (
                    <p className="text-xs text-amber-700">
                      Bargained: {formatTaka(i.unitPrice)} (listed {formatTaka(i.listPrice)})
                    </p>
                  ) : null}
                  {i.status !== 'active' ? (
                    <StatusBadge status={i.status} className="mt-1" />
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <p className="tabular-nums">
                    {i.quantity} × {formatTaka(i.unitPrice)}
                  </p>
                  <p className="font-medium tabular-nums">{formatTaka(i.lineTotal)}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t pt-3 text-sm">
            <Row label="Subtotal" value={formatTaka(so.subtotal)} />
            {so.discountTotal > 0 ? (
              <Row label="Coupon discount" value={`−${formatTaka(so.discountTotal)}`} />
            ) : null}
            <Row label="Order total" value={formatTaka(so.total)} strong />
            {delivery ? <Row label="Delivery charge" value={formatTaka(so.deliveryFee)} /> : null}
            <Row label="Paid online" value={formatTaka(so.total + so.deliveryFee - so.cashDue)} />
            <Row
              label={delivery ? 'Steadfast collects' : 'Cash to collect'}
              value={formatTaka(so.cashDue)}
            />
            <Row label="Platform commission" value={formatTaka(so.commissionTotal)} muted />
          </dl>
        </Panel>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-medium">{so.customer.fullName}</p>
            <a
              href={`tel:${so.customer.phone}`}
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Phone className="size-4" /> {formatPhone(so.customer.phone)}
            </a>
            {so.customer.noShowCount > 0 ? (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                <AlertTriangle className="size-4 shrink-0" />
                Didn’t collect {so.customer.noShowCount} earlier pickup order
                {so.customer.noShowCount > 1 ? 's' : ''}.
              </p>
            ) : null}
            {so.order.customerNote ? (
              <p className="mt-3 text-sm text-muted-foreground">“{so.order.customerNote}”</p>
            ) : null}
          </Panel>
          {delivery ? (
            <Panel title="Home delivery">
              {address ? (
                <AddressBlock address={address} />
              ) : (
                <p className="text-sm text-muted-foreground">No address on this order.</p>
              )}
              <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Delivery charge</span>
                  <span className="tabular-nums">{formatTaka(so.deliveryFee)}</span>
                </p>
                <CodLine cashDue={so.cashDue} className="text-sm" />
              </div>
            </Panel>
          ) : (
            <Panel title="Pickup">
              <p className="flex items-center gap-2 text-sm">
                {desk ? <Building2 className="size-4" /> : <Store className="size-4" />}
                {desk ? (so.pickupPoint?.nameEn ?? 'Mall pickup desk') : 'At your shop counter'}
              </p>
              {desk && so.pickupPoint?.instructions ? (
                <p className="mt-1 text-xs text-muted-foreground">{so.pickupPoint.instructions}</p>
              ) : null}
              {so.cashDue > 0 ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-700">
                  <Banknote className="size-4" /> Collect {formatTaka(so.cashDue)}
                </p>
              ) : null}
            </Panel>
          )}
          {so.shipment ? <ShipmentCard shopId={shopId} shipment={so.shipment} /> : null}
          <Panel title="Timeline">
            <ol className="space-y-3 border-l pl-4">
              {(so.events ?? []).map(e => (
                <li key={e.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{humanize(e.toStatus)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.createdAt, true)}
                    {e.actor?.fullName
                      ? ` · ${e.actor.fullName}`
                      : e.actor === null && e.fromStatus
                        ? ' · system'
                        : ''}
                  </p>
                  {e.note ? <p className="text-xs text-muted-foreground">{e.note}</p> : null}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? 'font-medium' : ''} ${muted ? 'text-muted-foreground' : ''}`}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
