'use client';

import { RefreshCw, Settings, Truck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { formatDate, formatPhone, formatTaka } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import {
  DeliveryStatusBadge,
  TrackingLink,
  ZoneBadge,
  useRefreshShipment,
  type ShipmentRow,
} from '@/app/(protected)/portal/shop/[shopId]/components/Delivery';
import {
  shopBase,
  useShopId,
  useShopRole,
} from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'all', label: 'All' },
];

export default function ShopDeliveriesPage() {
  const shopId = useShopId();
  const base = shopBase(shopId);
  const { canManage } = useShopRole(shopId);
  const [status, setStatus] = useState('open');
  const refresh = useRefreshShipment(shopId);
  const parcels = useCursorList<ShipmentRow>(
    ['shop', shopId, 'shipments', status],
    PORTAL_ENDPOINTS.shop.shipments(shopId),
    { ...(status !== 'all' && { status }), limit: 20 },
    { refetchInterval: 30_000 }
  );

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Parcels you’ve sent with Steadfast. Statuses update by themselves — tap refresh to ask the courier now."
        actions={
          canManage ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`${base}/settings#delivery`} />}
            >
              <Settings /> Delivery settings
            </Button>
          ) : undefined
        }
      />
      <Tabs value={status} onValueChange={v => setStatus(String(v))} className="mb-4">
        <TabsList>
          {FILTERS.map(f => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {parcels.isPending ? (
        <LoadingBlock />
      ) : parcels.isError ? (
        <EmptyState
          icon={Truck}
          title="Could not load deliveries"
          description={parcels.error?.message}
        />
      ) : !parcels.items.length ? (
        <EmptyState
          icon={Truck}
          title={status === 'open' ? 'No parcels on the road' : 'Nothing here yet'}
          description={
            status === 'open'
              ? 'Send a home-delivery order with Steadfast from its order page and it shows up here.'
              : undefined
          }
          action={
            <Button variant="outline" render={<Link href={`${base}/orders`} />}>
              Go to orders
            </Button>
          }
        />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead className="text-right">COD</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Refresh</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcels.items.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`${base}/orders/${s.shopOrderId}`}
                        className="font-medium hover:underline"
                      >
                        {s.subOrderNo}
                      </Link>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        #{s.consignmentId}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-56">
                      {s.recipient ? (
                        <>
                          <p className="truncate font-medium">{s.recipient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPhone(s.recipient.phone)}
                          </p>
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={s.recipient.address}
                          >
                            {s.recipient.address}
                          </p>
                          <ZoneBadge zone={s.recipient.zone} />
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.codAmount > 0 ? (
                        formatTaka(s.codAmount)
                      ) : (
                        <span className="text-emerald-700">Paid</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DeliveryStatusBadge status={s.status} />
                      {s.courierStatusLabel ? (
                        <p className="mt-1 max-w-44 text-xs text-muted-foreground">
                          {s.courierStatusLabel}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs">
                      <TrackingLink shipment={s} />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(s.createdAt, true)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Refresh ${s.subOrderNo}`}
                        disabled={refresh.isPending}
                        onClick={() => refresh.mutate(s.id)}
                      >
                        <RefreshCw
                          className={
                            refresh.isPending && refresh.variables === s.id ? 'animate-spin' : ''
                          }
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <LoadMore
            hasMore={!!parcels.hasMore}
            loading={parcels.isLoadingMore}
            onLoad={parcels.loadMore}
            label="Show more parcels"
          />
        </Panel>
      )}
    </div>
  );
}
