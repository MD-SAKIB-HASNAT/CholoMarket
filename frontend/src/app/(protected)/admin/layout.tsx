'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChartColumn,
  FileSpreadsheet,
  GalleryHorizontal,
  LayoutDashboard,
  Layers,
  Percent,
  Receipt,
  Search,
  Settings,
  MapPin,
  ShieldCheck,
  Store,
  Tag,
  Ticket,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardShell, LoadingBlock, type NavItem } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { api } from '@/utils/api/api';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { ROLE_LABEL } from './/utils/admin';
import type { AdminDashboard } from './/utils/types';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const { user, loading } = useRequireAuth();
  const role = user?.platformRole ?? null;
  const { data } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api<AdminDashboard>(ADMIN_ENDPOINTS.dashboard),
    enabled: !!role,
  });

  if (loading || !user) {
    return (
      <div className="container-page py-10">
        <LoadingBlock rows={6} />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShieldCheck}
          title="Admin access required"
          description="This console is only for platform staff. If you should have access, ask a super admin to add your number."
          action={<Button render={<Link href="/" />}>Back to shopping</Button>}
        />
      </div>
    );
  }

  const nav: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/markets', label: 'Markets', icon: Building2 },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/shops', label: 'Shops', icon: Store },
    {
      href: '/admin/verifications',
      label: 'Verifications',
      icon: ShieldCheck,
      badge: data?.pendingVerifications,
    },
    { href: '/admin/orders', label: 'Orders', icon: Receipt },
    { href: '/admin/shipments', label: 'Shipments', icon: Truck },
    { href: '/admin/banners', label: 'Banners', icon: GalleryHorizontal },
    { href: '/admin/categories', label: 'Categories', icon: Layers },
    { href: '/admin/brands', label: 'Brands', icon: Tag },
    { href: '/admin/commission', label: 'Commission', icon: Percent },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/finance', label: 'Finance', icon: Wallet },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/insights', label: 'Search insights', icon: Search },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/audit', label: 'Audit log', icon: FileSpreadsheet },
  ];

  return (
    <DashboardShell
      title="Admin console"
      nav={nav}
      context={
        <div className="rounded-lg border bg-background px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ChartColumn className="size-3.5" /> Platform staff
          </p>
          <p className="truncate text-sm font-medium">{user.fullName ?? user.phone}</p>
          <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {ROLE_LABEL[role]}
          </span>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
