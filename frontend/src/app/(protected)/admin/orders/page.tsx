'use client';

import { Receipt, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { StatusBadge } from '@/components/shared/Bits';
import { NativeSelect } from '@/components/shared/FormBits';
import { formatDate, formatTaka, humanize } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { AdminShopOrder } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

const STATUSES = [
  'placed',
  'confirmed',
  'ready_for_pickup',
  'completed',
  'rejected',
  'cancelled',
  'expired',
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const list = useCursorList<AdminShopOrder>(['admin', 'orders'], ADMIN_ENDPOINTS.orders.list, {
    status,
    q: search,
    limit: 25,
  });

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every shop order across the platform. Search by order number or customer phone."
      />
      <Panel>
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_14rem]">
          <form
            className="relative"
            onSubmit={e => {
              e.preventDefault();
              setSearch(q.trim());
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="CM-261023-… or 017…, press Enter"
              className="pl-8"
              aria-label="Search orders"
            />
          </form>
          <NativeSelect
            value={status}
            onChange={e => {
              setStatus(e.target.value);
            }}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </NativeSelect>
        </div>
        {list.isPending ? (
          <LoadingBlock />
        ) : list.error ? (
          <p className="py-8 text-center text-sm text-destructive">{list.error.message}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sub-order</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.length ? (
                  list.items.map(so => (
                    <TableRow
                      key={so.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${so.order.orderNo}`)}
                    >
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/admin/orders/${so.order.orderNo}`}
                          className="hover:text-primary"
                          onClick={e => e.stopPropagation()}
                        >
                          {so.subOrderNo}
                        </Link>
                        {so.order.status === 'pending_payment' ? (
                          <p className="font-sans text-[11px] text-amber-700">Awaiting payment</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{so.shop.nameEn}</TableCell>
                      <TableCell>{so.shop.market?.nameEn ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {so.fulfillmentType === 'desk_pickup'
                          ? 'Mall desk'
                          : so.fulfillmentType === 'delivery'
                            ? 'Delivery'
                            : 'Shop counter'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTaka(so.total)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={so.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(so.createdAt, true)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow colSpan={7}>
                    <Receipt className="mx-auto mb-2 size-5" /> No orders found.
                  </EmptyRow>
                )}
              </TableBody>
            </Table>
            <ListFoot
              shown={list.items.length}
              noun="order"
              hasMore={!!list.hasMore}
              loading={list.isLoadingMore}
              onLoad={list.loadMore}
            />
          </>
        )}
      </Panel>
    </>
  );
}
