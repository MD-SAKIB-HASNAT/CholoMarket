'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Handshake,
  Package,
  PackageCheck,
  Plus,
  Receipt,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RevenueChart } from '@/components/dashboard/Charts';
import { LoadingBlock, PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { api } from '@/utils/api/api';
import { formatTaka, variantText } from '@/utils/helpers/format';
import type { CursorPage } from '@/utils/types';
import { shopBase, useShopDashboard, useShopId } from './hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export default function ShopDashboardPage() {
  const shopId = useShopId();
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useShopDashboard(shopId);
  const base = shopBase(shopId);
  const parcels = useQuery({
    queryKey: ['shop', shopId, 'shipments', 'open-count'],
    // No totals on lists: count the first page of open parcels ("50+" if there are more).
    queryFn: () =>
      api<CursorPage<unknown>>(PORTAL_ENDPOINTS.shop.shipments(shopId), {
        query: { status: 'open', limit: 50 },
      }),
    refetchInterval: 60_000,
  });

  const restock = useMutation({
    mutationFn: (variantId: number) =>
      api(PORTAL_ENDPOINTS.shop.variantStock(shopId, variantId), {
        method: 'POST',
        body: { mode: 'adjust', quantity: 5, reason: 'restock' },
      }),
    onSuccess: () => {
      toast.success('Added 5 to stock');
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });

  if (isLoading) return <LoadingBlock rows={6} />;
  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Could not load the dashboard"
        description={error?.message}
      />
    );
  }

  const { shop } = data;
  const monthRevenue = data.series.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${shop.nameEn}`}
        description="Here’s what needs your attention today."
        actions={
          <>
            {data.plan ? <Badge variant="secondary">{data.plan.nameEn} plan</Badge> : null}
            <StatusBadge status={shop.status} />
            <Button size="sm" render={<Link href={`${base}/products/new`} />}>
              <Plus /> Add product
            </Button>
          </>
        }
      />

      {!shop.isVerified ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center">
          <BadgeCheck className="size-5 shrink-0" />
          <p className="flex-1 text-sm">
            Your shop isn’t verified yet. Verified shops get a blue badge and sell more. Upload your
            trade licence and we’ll schedule a visit.
          </p>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`${base}/settings#verification`} />}
          >
            Get verified
          </Button>
        </div>
      ) : null}
      {shop.status !== 'active' ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Your shop is <strong>{shop.status}</strong> and hidden from customers. Contact the
          platform team for help.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders today" value={data.ordersToday} icon={Receipt} />
        <StatCard
          label="Waiting for you"
          value={data.pending.placed + data.pending.confirmed}
          hint={`${data.pending.placed} new · ${data.pending.confirmed} confirmed`}
          icon={Clock}
          tone={data.pending.placed ? 'warning' : 'default'}
        />
        <StatCard
          label="Ready for pickup"
          value={data.pending.readyForPickup}
          icon={PackageCheck}
          tone="success"
        />
        <Link
          href={`${base}/deliveries`}
          className="rounded-xl transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <StatCard
            label="Parcels with courier"
            value={
              parcels.data ? `${parcels.data.items.length}${parcels.data.hasMore ? '+' : ''}` : '—'
            }
            hint="Out with Steadfast right now"
            icon={Truck}
          />
        </Link>
        <StatCard
          label="Open price offers"
          value={data.openOffers}
          icon={Handshake}
          tone={data.openOffers ? 'warning' : 'default'}
        />
        <StatCard
          label="Revenue this month"
          value={formatTaka(data.month.revenue)}
          hint={`${data.month.orders} orders · commission ${formatTaka(data.month.commission)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Balance owed to you"
          value={formatTaka(data.balance)}
          hint="Paid out weekly to your bKash / bank"
          icon={Wallet}
        />
        <StatCard label="Active products" value={data.productCount} icon={Package} />
        <StatCard
          label="Rating"
          value={shop.ratingCount ? shop.ratingAvg.toFixed(1) : '—'}
          hint={`${shop.ratingCount} reviews`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Sales — last 14 days"
          className="lg:col-span-2"
          action={<span className="text-sm text-muted-foreground">{formatTaka(monthRevenue)}</span>}
        >
          <RevenueChart data={data.series} valueKey="revenue" />
        </Panel>
        <Panel
          title="Low stock"
          action={
            <Button
              variant="link"
              size="sm"
              render={<Link href={`${base}/products?status=low_stock`} />}
            >
              View all
            </Button>
          }
        >
          {data.lowStock.length ? (
            <ul className="divide-y">
              {data.lowStock.map(v => (
                <li key={v.variantId} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${base}/products/${v.productId}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {v.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {variantText(v.attributes) || 'Default'} ·{' '}
                      <span className={v.availableQty === 0 ? 'font-medium text-deal' : ''}>
                        {v.availableQty} available
                      </span>
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={restock.isPending}
                    onClick={() => restock.mutate(v.variantId)}
                  >
                    <Plus /> 5
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              All products are well stocked.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
