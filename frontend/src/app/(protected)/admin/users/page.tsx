'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { StatusBadge } from '@/components/shared/Bits';
import { NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate, formatPhone } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { ROLE_LABEL, useAdminRole, type PlatformRole } from '@/app/(protected)/admin/utils/admin';
import type { AdminUser } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function UsersPage() {
  const qc = useQueryClient();
  const { can, user: me } = useAdminRole();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const list = useCursorList<AdminUser>(['admin', 'users'], ADMIN_ENDPOINTS.users.list, {
    q: search,
    limit: 25,
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api(ADMIN_ENDPOINTS.users.staffRole(id), { method: 'PUT', body: { role: role || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Staff role updated');
    },
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(ADMIN_ENDPOINTS.users.status(id), { method: 'PUT', body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Account updated');
    },
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Customers, shop staff and platform staff. Everyone logs in with their mobile number."
      />
      <Panel>
        <form
          className="relative mb-4 max-w-md"
          onSubmit={e => {
            e.preventDefault();
            setSearch(q.trim());
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Name, phone or email, press Enter"
            className="pl-8"
            aria-label="Search users"
          />
        </form>
        {list.isPending ? (
          <LoadingBlock />
        ) : list.error ? (
          <p className="py-8 text-center text-sm text-destructive">{list.error.message}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Staff role</TableHead>
                  <TableHead className="text-right">No-shows</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {can('userStatus') ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.length ? (
                  list.items.map(u => {
                    const self = u.id === me?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.fullName ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatPhone(u.phone)}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email ?? '—'}</TableCell>
                        <TableCell>
                          {can('staffRole') && !self ? (
                            <NativeSelect
                              className="h-7 w-36 text-xs"
                              value={u.platformRole ?? ''}
                              disabled={setRole.isPending}
                              onChange={e => setRole.mutate({ id: u.id, role: e.target.value })}
                              aria-label={`Staff role for ${u.fullName ?? u.phone}`}
                            >
                              <option value="">None</option>
                              {(Object.keys(ROLE_LABEL) as PlatformRole[]).map(r => (
                                <option key={r} value={r}>
                                  {ROLE_LABEL[r]}
                                </option>
                              ))}
                            </NativeSelect>
                          ) : u.platformRole ? (
                            ROLE_LABEL[u.platformRole as PlatformRole]
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${u.noShowCount >= 2 ? 'font-semibold text-amber-700' : ''}`}
                        >
                          {u.noShowCount}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        {can('userStatus') ? (
                          <TableCell className="text-right">
                            {self ? null : u.status === 'active' ? (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Suspend ${u.fullName ?? u.phone}? They won't be able to log in.`
                                    )
                                  )
                                    setStatus.mutate({ id: u.id, status: 'suspended' });
                                }}
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                onClick={() => setStatus.mutate({ id: u.id, status: 'active' })}
                              >
                                Reactivate
                              </Button>
                            )}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })
                ) : (
                  <EmptyRow colSpan={8}>
                    <Users className="mx-auto mb-2 size-5" /> No users found.
                  </EmptyRow>
                )}
              </TableBody>
            </Table>
            <ListFoot
              shown={list.items.length}
              noun="user"
              hasMore={!!list.hasMore}
              loading={list.isLoadingMore}
              onLoad={list.loadMore}
            />
          </>
        )}
      </Panel>
    </>
  );
}
