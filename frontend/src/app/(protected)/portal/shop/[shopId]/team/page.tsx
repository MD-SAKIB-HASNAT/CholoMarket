'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { Initials } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { formatDate, formatPhone, humanize } from '@/utils/helpers/format';
import type { User } from '@/utils/types';
import { useShopId, useShopRole } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { ManagerOnly } from '@/app/(protected)/portal/shop/[shopId]/components/ManagerOnly';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

interface Member {
  shopId: number;
  userId: number;
  role: 'owner' | 'manager' | 'staff';
  isActive: boolean;
  createdAt: string;
  user: User;
}

const ROLE_HELP: Record<string, string> = {
  owner: 'Everything, including payouts and team',
  manager: 'Products, prices, offers, orders',
  staff: 'Orders, stock updates and chat',
};

function ShopTeamPage() {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'manager' | 'staff'>('staff');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['shop', shopId, 'members'],
    queryFn: () => api<Member[]>(PORTAL_ENDPOINTS.shop.members(shopId)),
  });
  const { isOwner } = useShopRole(shopId);

  const add = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.shop.members(shopId), {
        method: 'POST',
        body: { phone: phone.trim(), role, ...(fullName.trim() && { fullName: fullName.trim() }) },
      }),
    onSuccess: () => {
      toast.success('Team member added. They can log in with their phone number.');
      setPhone('');
      setFullName('');
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'members'] });
    },
  });
  const remove = useMutation({
    mutationFn: (userId: number) =>
      api(PORTAL_ENDPOINTS.shop.member(shopId, userId), { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Access removed');
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'members'] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    add.mutate();
  }

  if (isLoading) return <LoadingBlock />;
  if (isError || !data)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Could not load the team"
        description={error?.message}
      />
    );

  const members = data.filter(m => m.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Give your staff their own login — no shared passwords."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={`Members (${members.length})`} className="lg:col-span-2">
          <ul className="divide-y">
            {members.map(m => {
              const name = m.user.fullName || formatPhone(m.user.phone);
              return (
                <li key={m.userId} className="flex items-center gap-3 py-3">
                  <Initials name={name} className="size-9 shrink-0 rounded-full text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPhone(m.user.phone)} · since {formatDate(m.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={m.role === 'owner' ? 'default' : 'secondary'}
                    title={ROLE_HELP[m.role]}
                  >
                    {humanize(m.role)}
                  </Badge>
                  {isOwner && m.role !== 'owner' ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${name}`}
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Remove ${name} from the team?`))
                          remove.mutate(m.userId);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Add a member">
          {isOwner ? (
            <form onSubmit={submit} className="grid gap-4">
              <Field label="Mobile number" htmlFor="phone">
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </Field>
              <Field label="Name" htmlFor="fullName">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  maxLength={80}
                />
              </Field>
              <Field label="Role" htmlFor="role" hint={ROLE_HELP[role]}>
                <NativeSelect
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value as typeof role)}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </NativeSelect>
              </Field>
              <Button type="submit" disabled={add.isPending || phone.length < 11}>
                <UserPlus /> Add to team
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only the shop owner can add or remove team members.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function ShopTeamPagePage() {
  return (
    <ManagerOnly>
      <ShopTeamPage />
    </ManagerOnly>
  );
}
