'use client';

import { ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { LoadingBlock } from '@/components/dashboard/DashboardShell';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { formatDate, formatTaka } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Order } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export default function OrdersPage() {
  const { user } = useRequireAuth();
  const orders = useCursorList<Order>(
    ['orders'],
    STORE_ENDPOINTS.orders.list,
    { limit: 20 },
    { enabled: !!user }
  );

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">My orders</h1>
      {orders.isPending ? (
        <LoadingBlock />
      ) : !orders.items.length ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Everything you order shows up here, with delivery tracking or pickup codes."
          action={<Button render={<Link href="/markets" />}>Start shopping</Button>}
        />
      ) : (
        <>
          <ul className="space-y-3">
            {orders.items.map(o => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.orderNo}`}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 transition hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{o.orderNo}</span>
                      <StatusBadge status={o.status} />
                      {o.status !== 'pending_payment' ? (
                        <StatusBadge status={o.paymentStatus} />
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.shopOrders.map(s => s.shop?.nameEn).join(' · ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.createdAt, true)} ·{' '}
                      {o.shopOrders.reduce(
                        (n, s) => n + s.items.reduce((m, i) => m + i.quantity, 0),
                        0
                      )}{' '}
                      items
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatTaka(o.grandTotal)}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          <LoadMore
            hasMore={!!orders.hasMore}
            loading={orders.isLoadingMore}
            onLoad={orders.loadMore}
            auto
            label="Show older orders"
          />
        </>
      )}
    </div>
  );
}
