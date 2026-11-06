'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { api } from '@/utils/api/api';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import { MarketForm, type MarketPayload } from '@/app/(protected)/admin/components/MarketForm';
import type { AdminMarket } from '@/app/(protected)/admin/utils/types';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function NewMarketPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const create = useMutation({
    mutationFn: (body: MarketPayload) =>
      api<AdminMarket>(ADMIN_ENDPOINTS.markets.list, { method: 'POST', body }),
    onSuccess: m => {
      qc.invalidateQueries({ queryKey: ['admin', 'markets'] });
      toast.success(`${m.nameEn} created`);
      router.push(`/admin/markets/${m.id}`);
    },
  });

  return (
    <>
      <PageHeader
        title="New market"
        description="Add a mall or market. You can add floors, pickup desks and management after saving."
        actions={
          <Button variant="outline" render={<Link href="/admin/markets" />}>
            <ArrowLeft /> All markets
          </Button>
        }
      />
      <Panel>
        <MarketForm
          submitLabel="Create market"
          submitting={create.isPending}
          disabled={!can('markets')}
          onSubmit={p => create.mutate(p)}
        />
      </Panel>
    </>
  );
}
