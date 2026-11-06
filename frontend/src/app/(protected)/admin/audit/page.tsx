'use client';

import { FileSpreadsheet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { formatDate, formatPhone, humanize } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { AuditEntry } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

function compact(changes: Record<string, unknown> | null): string {
  if (!changes) return '';
  return Object.entries(changes)
    .map(([k, v]) => {
      if (Array.isArray(v) && v.length === 2) return `${k}: ${String(v[0])} → ${String(v[1])}`;
      return `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`;
    })
    .join(', ');
}

export default function AuditPage() {
  const list = useCursorList<AuditEntry>(['admin', 'audit'], ADMIN_ENDPOINTS.audit.log, {
    limit: 30,
  });

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who changed what: verifications, prices, payouts, commission and staff roles."
      />
      <Panel>
        <QueryState
          isLoading={list.isPending}
          error={list.error}
          emptyIcon={FileSpreadsheet}
          emptyTitle="Nothing logged yet"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length ? (
                list.items.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(a.createdAt, true)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {a.actor ? (
                        (a.actor.fullName ?? formatPhone(a.actor.phone))
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.action}</code>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {humanize(a.entityType)}
                      {a.entityId ? ` #${a.entityId}` : ''}
                    </TableCell>
                    <TableCell
                      className="max-w-md truncate font-mono text-xs text-muted-foreground"
                      title={a.changes ? JSON.stringify(a.changes) : undefined}
                    >
                      {compact(a.changes) || '—'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyRow colSpan={5}>Nothing logged yet.</EmptyRow>
              )}
            </TableBody>
          </Table>
          <ListFoot
            shown={list.items.length}
            noun="entry"
            hasMore={!!list.hasMore}
            loading={list.isLoadingMore}
            onLoad={list.loadMore}
          />
        </QueryState>
      </Panel>
    </>
  );
}
