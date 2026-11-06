'use client';

import Link from 'next/link';
import { ExternalLink, Truck } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { StatusBadge } from '@/components/shared/Bits';
import { NativeSelect } from '@/components/shared/FormBits';
import { formatDate, formatTaka } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { AdminShipment } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open (with courier)' },
  { value: 'booked', label: 'Booked' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'partial_delivered', label: 'Partly delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

// The shared StatusBadge has no colour for courier states.
const TONE: Record<string, string> = {
  booked: 'bg-sky-50 text-sky-800 border-sky-200',
  in_transit: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  on_hold: 'bg-amber-50 text-amber-800 border-amber-200',
  delivered: 'bg-emerald-600 text-white border-emerald-600',
  partial_delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  returned: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function ShipmentsPage() {
  const [status, setStatus] = useState('');
  const list = useCursorList<AdminShipment>(
    ['admin', 'shipments'],
    ADMIN_ENDPOINTS.shipments.list,
    { status, limit: 25 },
    { refetchInterval: 60_000 }
  );

  return (
    <>
      <PageHeader
        title="Shipments"
        description="Every home-delivery parcel booked with a courier, across all shops."
        actions={
          <NativeSelect
            aria-label="Filter by status"
            className="w-44"
            value={status}
            onChange={e => {
              setStatus(e.target.value);
            }}
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        }
      />
      <Panel>
        <QueryState
          isLoading={list.isPending}
          error={list.error}
          emptyIcon={Truck}
          emptyTitle="No shipments"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Sub-order</TableHead>
                  <TableHead>Consignment</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="text-right">COD</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Courier says</TableHead>
                  <TableHead>Booked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.length ? (
                  list.items.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-44 truncate font-medium">
                        {s.shopName ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.orderNo ? (
                          <Link
                            href={`/admin/orders/${s.orderNo}`}
                            className="hover:text-primary hover:underline"
                          >
                            {s.subOrderNo}
                          </Link>
                        ) : (
                          s.subOrderNo
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.consignmentId}
                        {s.mode === 'mock' ? (
                          <Badge
                            variant="outline"
                            className="ml-1.5 border-violet-200 bg-violet-50 font-sans text-[10px] text-violet-800"
                          >
                            Test
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.trackingCode && s.trackingUrl ? (
                          <a
                            href={s.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                          >
                            {s.trackingCode} <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          (s.trackingCode ?? '—')
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTaka(s.codAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} className={TONE[s.status]} />
                      </TableCell>
                      <TableCell className="max-w-48 text-xs text-muted-foreground">
                        {s.courierStatusLabel ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(s.createdAt, true)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow colSpan={8}>
                    {status ? 'No parcels with this status.' : 'No parcels booked yet.'}
                  </EmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ListFoot
            shown={list.items.length}
            noun="parcel"
            hasMore={!!list.hasMore}
            loading={list.isLoadingMore}
            onLoad={list.loadMore}
          />
        </QueryState>
      </Panel>
    </>
  );
}
