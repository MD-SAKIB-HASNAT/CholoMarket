'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  CircleCheck,
  Clock,
  ExternalLink,
  Home,
  MapPin,
  PackageCheck,
  QrCode,
  RotateCcw,
  Star,
  Store,
  Truck,
  Undo2,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/Bits';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { Media } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { useAuth, useRequireAuth } from '@/utils/context/AuthContext';
import { floorLabel, formatDate, formatTaka, humanize, timeLeft } from '@/utils/helpers/format';
import type { OrderDetail, Shipment, ShopOrder } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

const PICKUP_STEPS = [
  { status: 'placed', label: 'Placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'ready_for_pickup', label: 'Ready' },
  { status: 'completed', label: 'Collected' },
];
const DELIVERY_STEPS = [
  { status: 'placed', label: 'Placed' },
  { status: 'confirmed', label: 'Packed' },
  { status: 'shipped', label: 'With courier' },
  { status: 'completed', label: 'Delivered' },
];
const OPEN = ['placed', 'confirmed', 'ready_for_pickup', 'shipped'];

function Steps({ status, delivery }: { status: string; delivery: boolean }) {
  const steps = delivery ? DELIVERY_STEPS : PICKUP_STEPS;
  const index = steps.findIndex(s => s.status === status);
  if (index < 0) return null;
  return (
    <ol className="flex items-center gap-1">
      {steps.map((s, i) => (
        <li key={s.status} className="flex flex-1 flex-col items-center gap-1">
          <span
            className={cn('h-1.5 w-full rounded-full', i <= index ? 'bg-primary' : 'bg-muted')}
          />
          <span
            className={cn(
              'text-[11px]',
              i <= index ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ReviewDialog({
  so,
  productId,
  productName,
  onDone,
}: {
  so: ShopOrder;
  productId?: number;
  productName?: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const submit = useMutation({
    mutationFn: () =>
      api(STORE_ENDPOINTS.reviews.list, {
        method: 'POST',
        body: { shopOrderId: so.id, productId, rating, comment: comment || undefined },
      }),
    onSuccess: () => {
      toast.success('Thanks for your review!');
      setOpen(false);
      onDone();
    },
  });
  return (
    <>
      <Button size="xs" variant="outline" onClick={() => setOpen(true)}>
        <Star /> Review {productId ? 'item' : 'shop'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {productName ?? so.shop?.nameEn}</DialogTitle>
            <DialogDescription>Your review helps other shoppers and the shop.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star
                  className={cn(
                    'size-8',
                    n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="What did you like? Anything to improve?"
          />
          <DialogFooter>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
              Submit review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReturnDialog({ so, onDone }: { so: ShopOrder; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('wrong_size');
  const [details, setDetails] = useState('');
  const [qty, setQty] = useState<Record<number, number>>({});
  const submit = useMutation({
    mutationFn: () =>
      api(STORE_ENDPOINTS.returns.list, {
        method: 'POST',
        body: {
          shopOrderId: so.id,
          reason,
          details: details || undefined,
          items: Object.entries(qty)
            .filter(([, q]) => q > 0)
            .map(([orderItemId, quantity]) => ({ orderItemId: Number(orderItemId), quantity })),
        },
      }),
    onSuccess: () => {
      toast.success('Return requested. The shop will reply soon.');
      setOpen(false);
      onDone();
    },
  });
  return (
    <>
      <Button size="xs" variant="ghost" onClick={() => setOpen(true)}>
        <RotateCcw /> Return / exchange
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a return</DialogTitle>
            <DialogDescription>
              Bring the item back to {so.shop?.nameEn} with its tags once they approve.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Reason">
              <NativeSelect value={reason} onChange={e => setReason(e.target.value)}>
                {[
                  'wrong_size',
                  'defective',
                  'not_as_described',
                  'wrong_item',
                  'changed_mind',
                  'warranty_claim',
                  'other',
                ].map(r => (
                  <option key={r} value={r}>
                    {humanize(r)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="grid gap-2">
              {so.items.map(i => (
                <label key={i.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    {i.productName} {i.variantLabel ? `(${i.variantLabel})` : ''}
                  </span>
                  <NativeSelect
                    className="w-20"
                    value={qty[i.id] ?? 0}
                    onChange={e => setQty({ ...qty, [i.id]: Number(e.target.value) })}
                  >
                    {Array.from({ length: i.quantity - i.returnedQty + 1 }, (_, n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
              ))}
            </div>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={2}
              placeholder="Tell the shop what happened"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => submit.mutate()}
              disabled={submit.isPending || !Object.values(qty).some(q => q > 0)}
            >
              Request return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TrackingCard({ shipment }: { shipment: Shipment }) {
  const events = [...shipment.events].reverse();
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-medium">
          <Truck className="size-4 text-primary" /> Steadfast Courier
        </p>
        <StatusBadge status={shipment.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Consignment <span className="font-mono">{shipment.consignmentId}</span>
        {shipment.courierStatusLabel ? ` · ${shipment.courierStatusLabel}` : ''}
      </p>
      {shipment.trackingUrl ? (
        <a
          href={shipment.trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Track on Steadfast <ExternalLink className="size-3" />
        </a>
      ) : null}
      {events.length ? (
        <ol className="mt-3 space-y-2 border-l pl-3">
          {events.map((e, i) => (
            <li key={e.id} className="relative">
              <span
                className={cn(
                  'absolute top-1.5 -left-[17px] size-2 rounded-full',
                  i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
                )}
              />
              <p className={cn('text-xs', i === 0 ? 'font-medium' : 'text-muted-foreground')}>
                {e.message ?? humanize(e.status)}
              </p>
              <p className="text-[11px] text-muted-foreground">{formatDate(e.createdAt, true)}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function ShopOrderCard({
  so,
  order,
  refetch,
}: {
  so: ShopOrder;
  order: OrderDetail;
  refetch: () => void;
}) {
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancel = useMutation({
    mutationFn: () =>
      api(STORE_ENDPOINTS.orders.cancelShopOrder(order.orderNo, so.id), {
        method: 'POST',
        body: { reason: 'Cancelled by customer' },
      }),
    onSuccess: () => {
      toast.success('Cancelled. Any online payment for this part will be refunded.');
      setCancelOpen(false);
      void qc.invalidateQueries({ queryKey: ['orders'] });
      refetch();
    },
  });
  const isOpen = OPEN.includes(so.status);
  const delivery = so.fulfillmentType === 'delivery';
  const address = order.deliveryAddress;
  const reviewedShop = order.reviews.some(r => r.shopOrderId === so.id && r.productId === null);
  const openReturn = order.returns.find(r => r.shopOrderId === so.id);
  const where =
    so.fulfillmentType === 'desk_pickup' && so.pickupPoint
      ? { icon: PackageCheck, title: so.pickupPoint.nameEn, sub: so.pickupPoint.instructions }
      : {
          icon: Store,
          title: `${so.shop?.nameEn} counter`,
          sub: [
            so.shop?.floor ? `${so.shop.floor.nameEn} (${floorLabel(so.shop.floor.level)})` : null,
            so.shop?.shopNumber ? `Shop ${so.shop.shopNumber}` : null,
            so.shop?.market?.nameEn,
          ]
            .filter(Boolean)
            .join(' · '),
        };

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <Link href={`/shops/${so.shop?.slug}`} className="font-medium hover:text-primary">
            {so.shop?.nameEn}
          </Link>
          <p className="font-mono text-xs text-muted-foreground">{so.subOrderNo}</p>
        </div>
        <StatusBadge status={so.status} />
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <Steps status={so.status} delivery={delivery} />
          {delivery ? (
            <div className="flex gap-3 rounded-lg bg-muted/50 p-3 text-sm">
              <Home className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">
                  Home delivery to {address?.recipientName ?? order.contactName}
                </p>
                {address ? (
                  <p className="text-xs text-muted-foreground">
                    {[address.addressLine, address.areaName, address.district]
                      .filter(Boolean)
                      .join(', ')}
                    {address.landmark ? ` (near ${address.landmark})` : ''} ·{' '}
                    {address.phone.replace('+88', '')}
                  </p>
                ) : null}
                {so.status === 'placed' || so.status === 'confirmed' ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    The shop is packing your parcel and will hand it to Steadfast.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          {delivery && so.shipment ? <TrackingCard shipment={so.shipment} /> : null}
          <div
            className={cn('flex gap-3 rounded-lg bg-muted/50 p-3 text-sm', delivery && 'hidden')}
          >
            <where.icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Pick up at {where.title}</p>
              {where.sub ? <p className="text-xs text-muted-foreground">{where.sub}</p> : null}
              {isOpen && so.reservedUntil && order.status !== 'pending_payment' ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                  <Clock className="size-3" /> Held until {formatDate(so.reservedUntil, true)} (
                  {timeLeft(so.reservedUntil)})
                </p>
              ) : null}
            </div>
          </div>
          <ul className="divide-y rounded-lg border">
            {so.items.map(i => (
              <li key={i.id} className="flex items-center gap-3 p-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-md border">
                  <Media src={i.imageUrl} alt={i.productName} seed={i.productName} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${i.productId}`}
                    className="line-clamp-1 text-sm font-medium hover:text-primary"
                  >
                    {i.productName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {i.variantLabel ? `${i.variantLabel} · ` : ''}
                    {i.quantity} × {formatTaka(i.unitPrice)}
                    {i.status !== 'active' ? ` · ${humanize(i.status)}` : ''}
                  </p>
                </div>
                {so.status === 'completed' &&
                !order.reviews.some(r => r.shopOrderId === so.id && r.productId === i.productId) ? (
                  <ReviewDialog
                    so={so}
                    productId={i.productId}
                    productName={i.productName}
                    onDone={refetch}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          {so.cancelReason ? (
            <p className="text-sm text-muted-foreground">Reason: {so.cancelReason}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          {!delivery && isOpen && so.pickupCode && order.status !== 'pending_payment' ? (
            <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-primary">
                <QrCode className="size-4" /> Pickup code
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em]">
                {so.pickupCode}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Show this at the counter. Never share it before you have your items.
              </p>
            </div>
          ) : null}
          {so.status === 'completed' ? (
            <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-900">
              <CircleCheck className="mx-auto size-6" />
              {delivery ? 'Delivered' : 'Collected'} {formatDate(so.completedAt, true)}
            </div>
          ) : null}
          {so.status === 'returned' ? (
            <div className="rounded-xl bg-rose-50 p-4 text-center text-sm text-rose-900">
              <Undo2 className="mx-auto size-6" />
              The courier couldn’t deliver this parcel. Anything you paid online is refunded.
            </div>
          ) : null}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="tabular-nums">{formatTaka(so.total)}</span>
            </div>
            {so.deliveryFee ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery charge</span>
                <span className="tabular-nums">{formatTaka(so.deliveryFee)}</span>
              </div>
            ) : null}
            {so.discountTotal ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums text-emerald-700">
                  −{formatTaka(so.discountTotal)}
                </span>
              </div>
            ) : null}
            {isOpen && so.cashDue > 0 ? (
              <div className="flex justify-between font-medium">
                <span className="flex items-center gap-1">
                  <Banknote className="size-4" /> {delivery ? 'Cash on delivery' : 'Pay in cash'}
                </span>
                <span className="tabular-nums">{formatTaka(so.cashDue)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {so.status === 'completed' && !reviewedShop ? (
              <ReviewDialog so={so} onDone={refetch} />
            ) : null}
            {so.status === 'completed' && !openReturn ? (
              <ReturnDialog so={so} onDone={refetch} />
            ) : null}
            {openReturn ? (
              <span className="text-xs text-muted-foreground">
                Return: <StatusBadge status={openReturn.status} />
              </span>
            ) : null}
            {so.status === 'placed' || so.status === 'confirmed' ? (
              <Button
                size="xs"
                variant="ghost"
                className="text-deal"
                onClick={() => setCancelOpen(true)}
              >
                <X /> Cancel this part
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {so.shop?.nameEn}’s part?</DialogTitle>
            <DialogDescription>
              The items go back on sale. Anything you paid online for this part is refunded to your
              wallet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function OrderDetailView() {
  useRequireAuth();
  const { user } = useAuth();
  const { orderNo } = useParams<{ orderNo: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const order = useQuery({
    queryKey: ['order', orderNo],
    queryFn: () => api<OrderDetail>(STORE_ENDPOINTS.orders.byOrderNo(orderNo)),
    enabled: !!user,
    refetchInterval: 20_000,
  });
  const pay = useMutation({
    mutationFn: (method: 'bkash' | 'nagad') =>
      api<{ id: number }>(STORE_ENDPOINTS.orders.pay(orderNo), {
        method: 'POST',
        body: { method },
      }),
    onSuccess: p => router.push(`/pay/${p.id}`),
  });

  if (!order.data) {
    return (
      <div className="container-page max-w-4xl space-y-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }
  const o = order.data;

  return (
    <div className="container-page max-w-4xl py-8">
      {params.get('placed') && o.status !== 'pending_payment' ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CircleCheck className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Order placed! Shops are preparing your items.</p>
            <p className="text-sm">
              {o.shopOrders.some(so => so.fulfillmentType === 'delivery')
                ? 'We’ll text you when each parcel is handed to Steadfast, with a tracking link.'
                : 'We’ll notify you when each part is ready. Show the pickup code at the counter.'}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h1 className="font-mono text-2xl font-semibold">{o.orderNo}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(o.createdAt, true)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={o.status} />
          <StatusBadge status={o.paymentStatus} />
        </div>
      </div>

      {o.status === 'pending_payment' ? (
        <div className="mb-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-medium">Waiting for payment of {formatTaka(o.amountDueOnline)}</p>
          <p className="text-sm">Complete payment in the next few minutes to confirm your order.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => pay.mutate('bkash')} disabled={pay.isPending}>
              <Wallet /> Pay with bKash
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => pay.mutate('nagad')}
              disabled={pay.isPending}
            >
              <Wallet /> Pay with Nagad
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {o.shopOrders.map(so => (
            <ShopOrderCard key={so.id} so={so} order={o} refetch={() => order.refetch()} />
          ))}
        </div>
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
            <p className="font-medium">Payment</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatTaka(o.subtotal)}</span>
            </div>
            {o.discountTotal ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Discount{o.coupon ? ` (${o.coupon.code})` : ''}
                </span>
                <span className="tabular-nums text-emerald-700">
                  −{formatTaka(o.discountTotal)}
                </span>
              </div>
            ) : null}
            {o.deliveryFee ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="tabular-nums">{formatTaka(o.deliveryFee)}</span>
              </div>
            ) : null}
            {o.pickupFee ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee</span>
                <span className="tabular-nums">{formatTaka(o.pickupFee)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatTaka(o.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid so far</span>
              <span className="tabular-nums">{formatTaka(o.amountPaid)}</span>
            </div>
            <ul className="space-y-1 border-t pt-2">
              {o.payments.map(p => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="capitalize">
                    {p.method} · {p.purpose}
                  </span>
                  <span className="flex items-center gap-1">
                    {formatTaka(p.amount)}{' '}
                    <StatusBadge status={p.status} className="h-4 text-[10px]" />
                  </span>
                </li>
              ))}
              {o.refunds.map(r => (
                <li
                  key={`r${r.id}`}
                  className="flex items-center justify-between text-xs text-emerald-700"
                >
                  <span>Refund</span>
                  <span>{formatTaka(r.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1 rounded-xl border bg-card p-4 text-sm">
            <p className="font-medium">Contact</p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" /> {o.contactName} · {o.contactPhone.replace('+88', '')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetailView />
    </Suspense>
  );
}
