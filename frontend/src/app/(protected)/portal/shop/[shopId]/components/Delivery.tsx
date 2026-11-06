'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Building2,
  CircleCheck,
  CirclePause,
  ExternalLink,
  FlaskConical,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  Store,
  Truck,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { Panel } from '@/components/dashboard/DashboardShell';
import { StatusBadge } from '@/components/shared/Bits';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate, formatPhone, formatTaka, humanize, timeAgo } from '@/utils/helpers/format';
import type { DeliveryAddress, DeliveryZone, Shipment, ShopOrder } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { shopBase, useShopRole } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export interface CourierAccount {
  id: number;
  shopId: number;
  provider: 'steadfast';
  mode: 'mock' | 'live';
  label: string;
  keyHint: string | null;
  isDefault: boolean;
  isActive: boolean;
  lastCheckedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

/** A shipment as the shipments lists return it. */
export type ShipmentRow = Shipment & {
  subOrderNo: string;
  shopName?: string;
  courierCharge?: number | null;
  recipient?: { name: string; phone: string; address: string; zone: DeliveryZone | null } | null;
};

const OPEN_SHIPMENT = ['booked', 'in_transit', 'on_hold'];

/** The shared StatusBadge knows the courier statuses too; kept as a name for the delivery screens. */
export const DeliveryStatusBadge = StatusBadge;

export function FulfillmentChip({
  so,
}: {
  so: Pick<ShopOrder, 'fulfillmentType' | 'pickupPoint'>;
}) {
  const [Icon, label] =
    so.fulfillmentType === 'delivery'
      ? [Truck, 'Home delivery']
      : so.fulfillmentType === 'desk_pickup'
        ? [Building2, so.pickupPoint?.nameEn ? `Mall desk · ${so.pickupPoint.nameEn}` : 'Mall desk']
        : [Store, 'Pickup at counter'];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        so.fulfillmentType === 'delivery'
          ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
          : 'bg-secondary text-secondary-foreground'
      )}
    >
      <Icon className="size-3.5" /> {label}
    </span>
  );
}

export function ZoneBadge({ zone }: { zone: DeliveryZone | null | undefined }) {
  if (!zone) return null;
  return (
    <Badge
      variant="outline"
      className={
        zone === 'inside_dhaka'
          ? 'border-sky-200 bg-sky-50 text-sky-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }
    >
      {zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
    </Badge>
  );
}

/** What the rider collects at the door. */
export function CodLine({ cashDue, className }: { cashDue: number; className?: string }) {
  return cashDue > 0 ? (
    <span className={cn('inline-flex items-center gap-1 font-medium text-amber-700', className)}>
      <Banknote className="size-3.5" /> Steadfast collects {formatTaka(cashDue)}
    </span>
  ) : (
    <span className={cn('text-emerald-700', className)}>Paid online — nothing to collect</span>
  );
}

export function AddressBlock({
  address,
  compact,
}: {
  address: DeliveryAddress;
  compact?: boolean;
}) {
  const place = [
    address.addressLine,
    address.landmark && `near ${address.landmark}`,
    address.areaName,
    address.district,
  ]
    .filter(Boolean)
    .join(', ');
  if (compact) {
    return (
      <p className="flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" />
        <span className="min-w-0">
          <span className="font-medium text-foreground">{address.recipientName}</span> ·{' '}
          {formatPhone(address.phone)} · {address.areaName}, {address.district}{' '}
          <ZoneBadge zone={address.zone} />
        </span>
      </p>
    );
  }
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{address.recipientName}</p>
      <a
        href={`tel:${address.phone}`}
        className="inline-flex items-center gap-1.5 text-primary hover:underline"
      >
        <Phone className="size-4" /> {formatPhone(address.phone)}
      </a>
      <p className="flex items-start gap-1.5 text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" /> {place}
      </p>
      <ZoneBadge zone={address.zone} />
    </div>
  );
}

export function TrackingLink({
  shipment,
  className,
}: {
  shipment: Pick<Shipment, 'trackingCode' | 'trackingUrl'>;
  className?: string;
}) {
  if (!shipment.trackingCode) return <span className="text-muted-foreground">—</span>;
  if (!shipment.trackingUrl)
    return <span className={cn('font-mono', className)}>{shipment.trackingCode}</span>;
  return (
    <a
      href={shipment.trackingUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex items-center gap-1 font-mono text-primary hover:underline',
        className
      )}
    >
      {shipment.trackingCode} <ExternalLink className="size-3" />
    </a>
  );
}

/** Ask Steadfast for the latest status of a parcel. */
export function useRefreshShipment(shopId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<Shipment>(PORTAL_ENDPOINTS.shop.shipmentRefresh(shopId, id), { method: 'POST' }),
    onSuccess: s => {
      toast.success(
        s.courierStatusLabel ? `Steadfast: ${s.courierStatusLabel}` : 'Status is up to date'
      );
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
    onError: e => toast.error(e.message),
  });
}

export function useCourierAccounts(shopId: number, enabled = true) {
  return useQuery({
    queryKey: ['shop', shopId, 'couriers'],
    queryFn: () => api<CourierAccount[]>(PORTAL_ENDPOINTS.shop.couriers(shopId)),
    enabled,
  });
}

interface SendProps {
  shopId: number;
  shopOrderId: number;
  subOrderNo: string;
  cashDue: number;
  address?: DeliveryAddress | null;
  size?: 'sm' | 'default';
  primary?: boolean;
}

/** "Send with Steadfast": pick the courier account, add a note for the rider, book the parcel. */
export function SendWithSteadfast({
  shopId,
  shopOrderId,
  subOrderNo,
  cashDue,
  address,
  size = 'sm',
  primary = true,
}: SendProps) {
  const qc = useQueryClient();
  const { canViewCouriers } = useShopRole(shopId);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const accounts = useCourierAccounts(shopId, open && canViewCouriers);
  const list = accounts.data ?? [];
  const fallback = list.find(a => a.isDefault) ?? list[0];
  const accountId = picked ?? (fallback ? String(fallback.id) : '');
  const noAccount = canViewCouriers && accounts.isSuccess && !list.length;

  const book = useMutation({
    mutationFn: () =>
      api<Shipment>(PORTAL_ENDPOINTS.shop.orderShipment(shopId, shopOrderId), {
        method: 'POST',
        body: {
          ...(accountId && { courierAccountId: Number(accountId) }),
          ...(note.trim() && { note: note.trim() }),
        },
      }),
    onSuccess: s => {
      toast.success(`Booked with Steadfast — consignment ${s.consignmentId}`);
      setOpen(false);
      setNote('');
      setPicked(null);
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
    onError: e => toast.error(e.message),
  });

  return (
    <>
      <Button size={size} variant={primary ? 'default' : 'outline'} onClick={() => setOpen(true)}>
        <Truck /> Send with Steadfast
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {subOrderNo} with Steadfast</DialogTitle>
            <DialogDescription>
              We book the parcel and the customer gets a tracking link. Pack it and keep it ready
              for the rider.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {canViewCouriers ? (
              accounts.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" /> Loading courier accounts…
                </p>
              ) : noAccount ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  No courier account yet.{' '}
                  <Link
                    href={`${shopBase(shopId)}/settings#delivery`}
                    className="font-medium underline"
                  >
                    Connect Steadfast in Delivery settings
                  </Link>
                  .
                </div>
              ) : (
                <Field label="Courier account" htmlFor={`courier-${shopOrderId}`}>
                  <NativeSelect
                    id={`courier-${shopOrderId}`}
                    value={accountId}
                    onChange={e => setPicked(e.target.value)}
                  >
                    {list.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                        {a.mode === 'mock' ? ' (test mode)' : ''}
                        {a.isDefault ? ' · default' : ''}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )
            ) : (
              <p className="text-xs text-muted-foreground">
                Uses the shop’s default Steadfast account.
              </p>
            )}

            <Field
              label="Note to the rider"
              htmlFor={`note-${shopOrderId}`}
              hint="Optional, e.g. “Call before coming”."
            >
              <Input
                id={`note-${shopOrderId}`}
                value={note}
                maxLength={200}
                onChange={e => setNote(e.target.value)}
                placeholder="Call before coming"
              />
            </Field>

            <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
              {address ? <AddressBlock address={address} compact /> : null}
              {cashDue > 0 ? (
                <p>
                  Rider collects <strong>{formatTaka(cashDue)}</strong> cash on delivery.
                </p>
              ) : (
                <p className="text-emerald-700">Paid online — the rider collects nothing.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={book.isPending || noAccount || (canViewCouriers && accounts.isLoading)}
              onClick={() => book.mutate()}
            >
              {book.isPending ? <LoaderCircle className="animate-spin" /> : <Truck />} Book parcel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const SIMULATE: { courierStatus: string; label: string; icon: typeof Truck }[] = [
  { courierStatus: 'pending', label: 'Picked up', icon: Truck },
  { courierStatus: 'hold', label: 'On hold', icon: CirclePause },
  { courierStatus: 'delivered', label: 'Delivered', icon: CircleCheck },
  { courierStatus: 'cancelled', label: 'Returned', icon: Undo2 },
];

/** The courier parcel for a delivery order: tracking, live status, history, and test-mode controls. */
export function ShipmentCard({ shopId, shipment }: { shopId: number; shipment: Shipment }) {
  const qc = useQueryClient();
  const refresh = useRefreshShipment(shopId);
  const simulate = useMutation({
    mutationFn: (courierStatus: string) =>
      api<Shipment>(PORTAL_ENDPOINTS.shop.shipmentMockStatus(shopId, shipment.id), {
        method: 'POST',
        body: { courierStatus },
      }),
    onSuccess: s => {
      toast.success(`Courier says: ${s.courierStatusLabel ?? humanize(s.status)}`);
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
    onError: e => toast.error(e.message),
  });
  const isOpen = OPEN_SHIPMENT.includes(shipment.status);

  return (
    <Panel
      title="Steadfast parcel"
      action={
        <Button
          size="sm"
          variant="outline"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate(shipment.id)}
        >
          <RefreshCw className={refresh.isPending ? 'animate-spin' : ''} /> Refresh
        </Button>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <DeliveryStatusBadge status={shipment.status} />
          {shipment.courierStatusLabel ? (
            <span className="text-muted-foreground">{shipment.courierStatusLabel}</span>
          ) : null}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt className="text-xs text-muted-foreground">Consignment</dt>
            <dd className="font-mono">{shipment.consignmentId}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tracking</dt>
            <dd>
              <TrackingLink shipment={shipment} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Cash on delivery</dt>
            <dd className="tabular-nums">
              {shipment.codAmount > 0 ? formatTaka(shipment.codAmount) : 'Nothing to collect'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last synced</dt>
            <dd>{shipment.lastSyncedAt ? timeAgo(shipment.lastSyncedAt) : '—'}</dd>
          </div>
        </dl>

        {shipment.events.length ? (
          <ol className="space-y-3 border-l pt-1 pl-4">
            {shipment.events.map(e => (
              <li key={e.id} className="relative">
                <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-indigo-500" />
                <p className="font-medium">{humanize(e.status)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.createdAt, true)} · {humanize(e.source)}
                </p>
                {e.message ? <p className="text-xs text-muted-foreground">{e.message}</p> : null}
              </li>
            ))}
          </ol>
        ) : null}

        {shipment.mode === 'mock' && isOpen ? (
          <div className="rounded-lg border border-dashed border-violet-300 bg-violet-50/60 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-violet-900">
              <FlaskConical className="size-3.5" /> Test mode — play the courier
            </p>
            <p className="mt-0.5 text-xs text-violet-900/80">
              No real rider is coming. Move the parcel along to see what the customer sees.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIMULATE.map(s => (
                <Button
                  key={s.courierStatus}
                  size="xs"
                  variant="outline"
                  disabled={simulate.isPending}
                  onClick={() => simulate.mutate(s.courierStatus)}
                >
                  <s.icon /> {s.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
