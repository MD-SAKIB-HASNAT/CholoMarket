'use client';

import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
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
import { Bn, StatusBadge } from '@/components/shared/Bits';
import { MARKET_KIND_LABEL } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { marketLocationPath, useAdminRole } from '@/app/(protected)/admin/utils/admin';
import type { AdminMarket } from '@/app/(protected)/admin/utils/types';
import { ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function AdminMarketsPage() {
  const router = useRouter();
  const { can } = useAdminRole();
  const list = useCursorList<AdminMarket>(['admin', 'markets'], ADMIN_ENDPOINTS.markets.list, {
    limit: 30,
  });
  const data = list.items;

  return (
    <>
      <PageHeader
        title="Malls & markets"
        description="Every mall and market on the platform, including drafts."
        actions={
          can('markets') ? (
            <Button render={<Link href="/admin/markets/new" />}>
              <Plus /> New market
            </Button>
          ) : null
        }
      />
      <QueryState
        isLoading={list.isPending}
        error={list.error}
        empty={!data.length}
        emptyIcon={Building2}
        emptyTitle="No markets yet"
        emptyDescription="Add the first mall to start onboarding shops."
      >
        <Panel className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Floors</TableHead>
                <TableHead className="text-right">Pickup desks</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(m => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/markets/${m.id}`)}
                >
                  <TableCell>
                    <Link
                      href={`/admin/markets/${m.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {m.nameEn}
                    </Link>
                    <Bn className="block text-xs">{m.nameBn}</Bn>
                  </TableCell>
                  <TableCell>{MARKET_KIND_LABEL[m.kind]}</TableCell>
                  <TableCell className="text-sm">{marketLocationPath(m) || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.floors.length}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.pickupPoints.length}</TableCell>
                  <TableCell>
                    {m.isPartner ? <Badge variant="secondary">Partner</Badge> : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <ListFoot
          shown={data.length}
          noun="market"
          hasMore={!!list.hasMore}
          loading={list.isLoadingMore}
          onLoad={list.loadMore}
        />
      </QueryState>
    </>
  );
}
