'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, SearchX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { api } from '@/utils/api/api';
import { EmptyRow, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

interface Insights {
  top: { query: string; searches: number; avgResults: number }[];
  zero: { query: string; searches: number }[];
}

export default function InsightsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'insights'],
    queryFn: () => api<Insights>(ADMIN_ENDPOINTS.insights.searches),
  });

  return (
    <>
      <PageHeader
        title="Search insights"
        description="What customers searched for in the last 30 days. Zero-result searches show which shops and products to bring on next — and train smarter Bangla search later."
      />
      <QueryState
        isLoading={isLoading}
        error={error}
        emptyIcon={Search}
        emptyTitle="No searches yet"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Top searches" action={<Search className="size-4 text-muted-foreground" />}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                  <TableHead className="text-right">Avg results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.top.length ? (
                  data.top.map(r => (
                    <TableRow key={r.query}>
                      <TableCell>{r.query}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.searches}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.avgResults}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow colSpan={3}>No searches in the last 30 days.</EmptyRow>
                )}
              </TableBody>
            </Table>
          </Panel>
          <Panel
            title="Searches with no results"
            action={<SearchX className="size-4 text-muted-foreground" />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.zero.length ? (
                  data.zero.map(r => (
                    <TableRow key={r.query}>
                      <TableCell className="font-medium">{r.query}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.searches}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow colSpan={2}>Every search found something.</EmptyRow>
                )}
              </TableBody>
            </Table>
          </Panel>
        </div>
      </QueryState>
    </>
  );
}
