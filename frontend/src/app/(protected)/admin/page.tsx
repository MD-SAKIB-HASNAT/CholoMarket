'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CircleDollarSign,
  HandCoins,
  Package,
  Receipt,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarList, RevenueChart } from '@/components/dashboard/Charts';
import { PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardShell';
import { api } from '@/utils/api/api';
import { formatTaka } from '@/utils/helpers/format';
import { QueryState } from './/components/AdminUi';
import type { AdminDashboard } from './/utils/types';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api<AdminDashboard>(ADMIN_ENDPOINTS.dashboard),
  });

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Markets, shops and money moving through the platform this month."
        actions={
          <>
            <Button variant="outline" render={<Link href="/admin/verifications" />}>
              <ShieldCheck /> Review verifications
            </Button>
            <Button render={<Link href="/admin/shops/new" />}>
              <Store /> Onboard shop
            </Button>
          </>
        }
      />
      <QueryState isLoading={isLoading} error={error} emptyIcon={TrendingUp} emptyTitle="No data">
        {data ? (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Active markets" value={data.markets} icon={Building2} />
              <StatCard label="Active shops" value={data.shops} icon={Store} tone="success" />
              <StatCard
                label="Pending shops"
                value={data.pendingShops}
                icon={Store}
                tone={data.pendingShops ? 'warning' : 'default'}
              />
              <StatCard label="Live products" value={data.products} icon={Package} />
              <StatCard label="Users" value={data.users} icon={Users} />
              <StatCard label="Orders today" value={data.ordersToday} icon={Receipt} />
              <StatCard label="Orders this month" value={data.ordersMonth} icon={Receipt} />
              <StatCard
                label="GMV this month"
                value={formatTaka(data.gmvMonth)}
                icon={CircleDollarSign}
                tone="success"
                hint="Completed orders"
              />
              <StatCard
                label="Commission this month"
                value={formatTaka(data.commissionMonth)}
                icon={HandCoins}
              />
              <StatCard
                label="Pending verifications"
                value={data.pendingVerifications}
                icon={ShieldCheck}
                tone={data.pendingVerifications ? 'warning' : 'default'}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="GMV — last 30 days" className="lg:col-span-2">
                <RevenueChart data={data.series} valueKey="gmv" label="GMV" />
              </Panel>
              <Panel title="Top categories">
                {data.topCategories.length ? (
                  <BarList data={data.topCategories} labelKey="nameEn" valueKey="gmv" />
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No completed sales yet.
                  </p>
                )}
              </Panel>
            </div>
            <Panel
              title="Searches with no results (30 days)"
              action={
                <Button variant="link" size="sm" render={<Link href="/admin/insights" />}>
                  All insights
                </Button>
              }
            >
              <p className="mb-3 text-sm text-muted-foreground">
                Customers looked for these and found nothing — tell the onboarding team which shops
                or products to bring on.
              </p>
              {data.zeroResultSearches.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.zeroResultSearches.map(s => (
                    <span
                      key={s.query}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                    >
                      <Search className="size-3.5 text-muted-foreground" /> {s.query}
                      <span className="text-xs text-muted-foreground">×{s.searches}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Every search found something. 🎉</p>
              )}
            </Panel>
          </div>
        ) : null}
      </QueryState>
    </>
  );
}
