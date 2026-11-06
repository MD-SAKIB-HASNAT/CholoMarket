'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import type { Verification } from '@/app/(protected)/admin/utils/types';
import { ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ReviewDialog, VerificationRow } from '@/app/(protected)/admin/components/Verification';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

type Status = 'pending' | 'approved' | 'rejected';

export default function VerificationsPage() {
  const { can } = useAdminRole();
  const [status, setStatus] = useState<Status>('pending');
  const [reviewing, setReviewing] = useState<{
    v: Verification;
    decision: 'approved' | 'rejected';
  } | null>(null);
  const list = useCursorList<Verification>(
    ['admin', 'verifications'],
    ADMIN_ENDPOINTS.verifications.list,
    {
      status,
      limit: 20,
    }
  );

  return (
    <>
      <PageHeader
        title="Shop verification"
        description="Documents shops have uploaded. A shop gets the verified badge once its trade licence is approved and our team has visited it."
      />
      <Panel>
        <Tabs value={status} onValueChange={v => setStatus(v as Status)} className="mb-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <QueryState
          isLoading={list.isPending}
          error={list.error}
          empty={!list.items.length}
          emptyIcon={ShieldCheck}
          emptyTitle={
            status === 'pending' ? 'Nothing waiting for review' : `No ${status} documents`
          }
          emptyDescription={
            status === 'pending' ? 'New uploads from shop owners will appear here.' : undefined
          }
        >
          <div className="grid gap-2">
            {list.items.map(v => (
              <div key={v.id}>
                <VerificationRow
                  v={v}
                  showShop
                  canReview={can('shops')}
                  onReview={(vv, decision) => setReviewing({ v: vv, decision })}
                />
                {v.shop ? (
                  <Link
                    href={`/admin/shops/${v.shopId}`}
                    className="ml-3 text-xs text-primary hover:underline"
                  >
                    Open shop →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
          <ListFoot
            shown={list.items.length}
            noun="document"
            hasMore={!!list.hasMore}
            loading={list.isLoadingMore}
            onLoad={list.loadMore}
          />
        </QueryState>
      </Panel>
      {reviewing ? (
        <ReviewDialog
          verification={reviewing.v}
          decision={reviewing.decision}
          onClose={() => setReviewing(null)}
        />
      ) : null}
    </>
  );
}
