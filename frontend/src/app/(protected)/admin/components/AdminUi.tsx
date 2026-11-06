'use client';

import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { LoadingBlock } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import type { LucideIcon } from 'lucide-react';

/** Foot of a cursor-paged table: how many rows are showing and a "Show more" button while there are more. */
export function ListFoot({
  shown,
  noun,
  hasMore,
  loading,
  onLoad,
}: {
  shown: number;
  noun: string;
  hasMore: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">
        Showing {shown} {shown === 1 ? noun : `${noun}s`}
        {hasMore ? ' so far' : ''}
      </p>
      <LoadMore
        hasMore={hasMore}
        loading={loading}
        onLoad={onLoad}
        className="flex justify-center"
      />
    </div>
  );
}

/** Loading / error / empty wrapper for a query-backed block. */
export function QueryState({
  isLoading,
  error,
  empty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}: {
  isLoading: boolean;
  error: Error | null;
  empty?: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingBlock />;
  if (error)
    return <EmptyState icon={CircleAlert} title="Could not load" description={error.message} />;
  if (empty)
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  return <>{children}</>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}

export function DefList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="mt-0.5 font-medium">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
