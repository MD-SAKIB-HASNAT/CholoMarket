'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { api } from '@/utils/api/api';
import { formatDate, formatPhone, formatTaka, humanize } from '@/utils/helpers/format';
import type { AdminOrderDetail } from '@/app/(protected)/admin/utils/types';
import { DefList, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function AdminOrderDetailPage() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'order', orderNo],
    queryFn: () => api<AdminOrderDetail>(ADMIN_ENDPOINTS.orders.byOrderNo(orderNo)),
  });

  return (
    <>
      <PageHeader
        title={`Order ${decodeURIComponent(orderNo)}`}
        description={
          order ? `Placed ${formatDate(order.placedAt ?? order.createdAt, true)}` : undefined
        }
        actions={
          <Button variant="outline" render={<Link href="/admin/orders" />}>
            <ArrowLeft /> All orders
          </Button>
        }
      />
      <QueryState
        isLoading={isLoading}
        error={error}
        empty={!order}
        emptyIcon={Receipt}
        emptyTitle="Order not found"
      >
        {order ? (
          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Customer">
                <DefList
                  items={[
                    ['Name', order.contactName],
                    ['Phone', formatPhone(order.contactPhone)],
                    ['Account', order.customer.fullName ?? formatPhone(order.customer.phone)],
                    ['Uncollected pickup orders', order.customer.noShowCount],
                    ['Note', order.customerNote ?? '—'],
                  ]}
                />
              </Panel>
              <Panel title="Payment" action={<StatusBadge status={order.paymentStatus} />}>
                <DefList
                  items={[
                    ['Order status', <StatusBadge key="s" status={order.status} />],
                    ['Subtotal', formatTaka(order.subtotal)],
                    ['Discount', order.discountTotal ? `−${formatTaka(order.discountTotal)}` : '—'],
                    ['Pickup fee', formatTaka(order.pickupFee)],
                    ['Grand total', formatTaka(order.grandTotal)],
                    ['Due online', formatTaka(order.amountDueOnline)],
                    ['Paid so far', formatTaka(order.amountPaid)],
                  ]}
                />
              </Panel>
            </div>
            {[...order.shopOrders]
              .sort((a, b) => a.subOrderNo.localeCompare(b.subOrderNo))
              .map(so => (
                <Panel
                  key={so.id}
                  title={`${so.subOrderNo} · ${so.shop.nameEn}`}
                  action={<StatusBadge status={so.status} />}
                >
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Unit</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {so.items.map(i => (
                            <TableRow key={i.id}>
                              <TableCell>
                                <p className="font-medium">{i.productName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {i.variantLabel ?? ''}
                                  {i.offerId ? ' · bargained' : ''}
                                  {i.status !== 'active' ? ` · ${humanize(i.status)}` : ''}
                                </p>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatTaka(i.unitPrice)}
                                {i.unitPrice !== i.listPrice ? (
                                  <span className="block text-xs text-muted-foreground line-through">
                                    {formatTaka(i.listPrice)}
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {i.quantity}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatTaka(i.lineTotal)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatTaka(i.commissionAmount)}{' '}
                                <span className="text-xs text-muted-foreground">
                                  ({i.commissionRate}%)
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-3 grid gap-1 text-sm sm:ml-auto sm:w-72">
                        <Row label="Subtotal" value={formatTaka(so.subtotal)} />
                        {so.discountTotal ? (
                          <Row label="Discount" value={`−${formatTaka(so.discountTotal)}`} />
                        ) : null}
                        <Row label="Total" value={formatTaka(so.total)} strong />
                        <Row label="Cash due at pickup" value={formatTaka(so.cashDue)} />
                        <Row label="Platform commission" value={formatTaka(so.commissionTotal)} />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Timeline</p>
                      <ol className="relative grid gap-3 border-l pl-4">
                        {[...(so.events ?? [])]
                          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
                          .map(e => (
                            <li key={e.id} className="relative">
                              <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background bg-primary" />
                              <p className="text-sm font-medium">{humanize(e.toStatus)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(e.createdAt, true)}
                              </p>
                              {e.note ? (
                                <p className="text-xs text-muted-foreground">“{e.note}”</p>
                              ) : null}
                            </li>
                          ))}
                      </ol>
                      <p className="mt-4 text-xs text-muted-foreground">
                        {so.fulfillmentType === 'desk_pickup'
                          ? 'Collect at mall pickup desk'
                          : 'Collect at shop counter'}
                        {so.reservedUntil &&
                        ['placed', 'confirmed', 'ready_for_pickup'].includes(so.status)
                          ? ` · held until ${formatDate(so.reservedUntil, true)}`
                          : ''}
                      </p>
                      {so.cancelReason ? (
                        <p className="mt-1 text-xs text-destructive">Reason: {so.cancelReason}</p>
                      ) : null}
                    </div>
                  </div>
                </Panel>
              ))}
          </div>
        ) : null}
      </QueryState>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold' : 'text-muted-foreground'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
