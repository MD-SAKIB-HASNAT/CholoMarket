'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Check,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { Bn, StatusBadge } from '@/components/shared/Bits';
import { Field, ImageUploader, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { floorLabel, formatPhone, formatTime, humanize } from '@/utils/helpers/format';
import type { Floor, PickupPoint } from '@/utils/types';
import { hhmm, marketLocationPath, useAdminRole } from '@/app/(protected)/admin/utils/admin';
import { MarketForm, type MarketPayload } from '@/app/(protected)/admin/components/MarketForm';
import type { AdminMarket } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function AdminMarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const key = ['admin', 'market', id];
  const {
    data: market,
    isLoading,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: key,
    queryFn: () => api<AdminMarket>(ADMIN_ENDPOINTS.markets.byId(id)),
  });
  const setMarket = (m: AdminMarket) => {
    qc.setQueryData(key, m);
    qc.invalidateQueries({ queryKey: ['admin', 'markets'] });
  };

  const update = useMutation({
    mutationFn: (body: MarketPayload) =>
      api<AdminMarket>(ADMIN_ENDPOINTS.markets.byId(id), { method: 'PATCH', body }),
    onSuccess: m => {
      setMarket(m);
      toast.success('Market saved');
    },
  });

  return (
    <>
      <PageHeader
        title={market?.nameEn ?? 'Market'}
        description={market ? <Bn>{market.nameBn}</Bn> : undefined}
        actions={
          <>
            <Button variant="outline" render={<Link href="/admin/markets" />}>
              <ArrowLeft /> All markets
            </Button>
            {market ? (
              <>
                <Button variant="outline" render={<Link href={`/portal/market/${market.id}`} />}>
                  <Building2 /> Market portal
                </Button>
              </>
            ) : null}
          </>
        }
      />
      <QueryState
        isLoading={isLoading}
        error={error}
        emptyIcon={Building2}
        emptyTitle="Market not found"
        empty={!market}
      >
        {market ? (
          <div className="grid gap-6 xl:grid-cols-5">
            <Panel
              title="Details"
              className="xl:col-span-3"
              action={<StatusBadge status={market.status} />}
            >
              <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />{' '}
                {marketLocationPath(market) || 'No location set'}
              </p>
              <MarketForm
                key={dataUpdatedAt}
                initial={market}
                submitLabel="Save changes"
                submitting={update.isPending}
                disabled={!can('markets')}
                onSubmit={p => update.mutate(p)}
              />
            </Panel>
            <div className="grid content-start gap-6 xl:col-span-2">
              <FloorsManager market={market} onChange={setMarket} editable={can('markets')} />
              <MembersManager
                market={market}
                onChange={setMarket}
                editable={can('marketMembers')}
              />
            </div>
            <div className="xl:col-span-5">
              <PickupPointsManager market={market} onChange={setMarket} editable={can('markets')} />
            </div>
          </div>
        ) : null}
      </QueryState>
    </>
  );
}

// ------------------------------------------------------------ floors

function FloorsManager({
  market,
  onChange,
  editable,
}: {
  market: AdminMarket;
  onChange: (m: AdminMarket) => void;
  editable: boolean;
}) {
  const [form, setForm] = useState({ level: '', nameEn: '', nameBn: '', map: [] as string[] });
  const [editing, setEditing] = useState<Floor | null>(null);
  const floors = [...market.floors].sort((a, b) => a.level - b.level);

  const add = useMutation({
    mutationFn: () =>
      api<AdminMarket>(ADMIN_ENDPOINTS.markets.floors(market.id), {
        method: 'POST',
        body: {
          level: Number(form.level),
          nameEn: form.nameEn.trim(),
          ...(form.nameBn.trim() && { nameBn: form.nameBn.trim() }),
          ...(form.map[0] && { mapImageUrl: form.map[0] }),
        },
      }),
    onSuccess: m => {
      onChange(m);
      setForm({ level: '', nameEn: '', nameBn: '', map: [] });
      toast.success('Floor added');
    },
  });
  const remove = useMutation({
    mutationFn: (floorId: number) =>
      api<AdminMarket>(ADMIN_ENDPOINTS.floors.byId(floorId), { method: 'DELETE' }),
    onSuccess: m => {
      onChange(m);
      toast.success('Floor removed');
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    add.mutate();
  }

  return (
    <Panel title="Floors" action={<Layers className="size-4 text-muted-foreground" />}>
      <p className="mb-3 text-xs text-muted-foreground">
        Floors power the walk-through: customers browse shops floor by floor.
      </p>
      {floors.length ? (
        <ul className="mb-4 divide-y rounded-lg border">
          {floors.map(f => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                {floorLabel(f.level)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.nameEn}</p>
                <Bn className="block truncate text-xs">{f.nameBn}</Bn>
              </div>
              {editable ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${f.nameEn}`}
                    onClick={() => setEditing(f)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${f.nameEn}`}
                    disabled={remove.isPending}
                    onClick={() => {
                      if (confirm(`Delete ${f.nameEn}? Shops must be moved off it first.`))
                        remove.mutate(f.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">No floors yet.</p>
      )}
      {editable ? (
        <form onSubmit={submit} className="grid gap-3 rounded-lg border border-dashed p-3">
          <p className="text-sm font-medium">Add floor</p>
          <div className="grid grid-cols-[5rem_1fr] gap-2">
            <Field label="Level" htmlFor="fl-level" hint="0 = ground, -1 = basement">
              <Input
                id="fl-level"
                type="number"
                required
                min={-5}
                max={50}
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
              />
            </Field>
            <Field label="Name" htmlFor="fl-name">
              <Input
                id="fl-name"
                required
                placeholder="Level 2"
                value={form.nameEn}
                onChange={e => setForm({ ...form, nameEn: e.target.value })}
              />
            </Field>
          </div>
          <Field label="নাম (বাংলা)" htmlFor="fl-bn">
            <Input
              id="fl-bn"
              lang="bn"
              value={form.nameBn}
              onChange={e => setForm({ ...form, nameBn: e.target.value })}
            />
          </Field>
          <Field label="Floor map (optional)">
            <ImageUploader value={form.map} onChange={map => setForm({ ...form, map })} max={1} />
          </Field>
          <Button type="submit" size="sm" disabled={add.isPending} className="w-fit">
            <Plus /> Add floor
          </Button>
        </form>
      ) : null}
      {editing ? (
        <FloorDialog floor={editing} onClose={() => setEditing(null)} onSaved={onChange} />
      ) : null}
    </Panel>
  );
}

function FloorDialog({
  floor,
  onClose,
  onSaved,
}: {
  floor: Floor;
  onClose: () => void;
  onSaved: (m: AdminMarket) => void;
}) {
  const [f, setF] = useState({
    level: String(floor.level),
    nameEn: floor.nameEn,
    nameBn: floor.nameBn ?? '',
    map: floor.mapImageUrl ? [floor.mapImageUrl] : ([] as string[]),
  });
  const save = useMutation({
    mutationFn: () =>
      api<AdminMarket>(ADMIN_ENDPOINTS.floors.byId(floor.id), {
        method: 'PATCH',
        body: {
          level: Number(f.level),
          nameEn: f.nameEn.trim(),
          ...(f.nameBn.trim() && { nameBn: f.nameBn.trim() }),
          ...(f.map[0] && { mapImageUrl: f.map[0] }),
        },
      }),
    onSuccess: m => {
      onSaved(m);
      toast.success('Floor updated');
      onClose();
    },
  });
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit floor</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-[5rem_1fr] gap-2">
            <Field label="Level" htmlFor="ef-level">
              <Input
                id="ef-level"
                type="number"
                value={f.level}
                onChange={e => setF({ ...f, level: e.target.value })}
              />
            </Field>
            <Field label="Name" htmlFor="ef-name">
              <Input
                id="ef-name"
                value={f.nameEn}
                onChange={e => setF({ ...f, nameEn: e.target.value })}
              />
            </Field>
          </div>
          <Field label="নাম (বাংলা)" htmlFor="ef-bn">
            <Input
              id="ef-bn"
              lang="bn"
              value={f.nameBn}
              onChange={e => setF({ ...f, nameBn: e.target.value })}
            />
          </Field>
          <Field label="Floor map">
            <ImageUploader value={f.map} onChange={map => setF({ ...f, map })} max={1} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || !f.nameEn.trim() || f.level === ''}
          >
            <Check /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------ pickup points

function PickupPointsManager({
  market,
  onChange,
  editable,
}: {
  market: AdminMarket;
  onChange: (m: AdminMarket) => void;
  editable: boolean;
}) {
  const [editing, setEditing] = useState<PickupPoint | 'new' | null>(null);
  const floorName = (id: number | null) => market.floors.find(f => f.id === id)?.nameEn ?? '—';

  return (
    <Panel
      title="Pickup desks"
      action={
        editable ? (
          <Button size="sm" variant="outline" onClick={() => setEditing('new')}>
            <Plus /> Add desk
          </Button>
        ) : null
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Customers can collect orders from any shop in this market at a desk. In Phase 2 the
        ground-floor desk becomes the rider hub.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Desk</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Instructions</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
            {editable ? <TableHead className="w-12" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {market.pickupPoints.length ? (
            market.pickupPoints.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium">{p.nameEn}</p>
                  <Bn className="text-xs">{p.nameBn}</Bn>
                </TableCell>
                <TableCell>{floorName(p.floorId)}</TableCell>
                <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                  {p.instructions ?? '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {p.opensAt && p.closesAt
                    ? `${formatTime(p.opensAt)} – ${formatTime(p.closesAt)}`
                    : '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                </TableCell>
                {editable ? (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${p.nameEn}`}
                      onClick={() => setEditing(p)}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <EmptyRow colSpan={6}>
              <MapPin className="mx-auto mb-2 size-5" /> No pickup desks. Customers can still
              collect from each shop’s counter.
            </EmptyRow>
          )}
        </TableBody>
      </Table>
      {editing ? (
        <PickupPointDialog
          market={market}
          point={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={onChange}
        />
      ) : null}
    </Panel>
  );
}

function PickupPointDialog({
  market,
  point,
  onClose,
  onSaved,
}: {
  market: AdminMarket;
  point: PickupPoint | null;
  onClose: () => void;
  onSaved: (m: AdminMarket) => void;
}) {
  const [f, setF] = useState({
    nameEn: point?.nameEn ?? '',
    nameBn: point?.nameBn ?? '',
    floorId: point?.floorId ? String(point.floorId) : '',
    instructions: point?.instructions ?? '',
    opensAt: hhmm(point?.opensAt),
    closesAt: hhmm(point?.closesAt),
    isActive: point?.isActive ?? true,
  });
  const save = useMutation({
    mutationFn: () => {
      const body = {
        nameEn: f.nameEn.trim(),
        ...(f.nameBn.trim() && { nameBn: f.nameBn.trim() }),
        ...(f.floorId && { floorId: Number(f.floorId) }),
        ...(f.instructions.trim() && { instructions: f.instructions.trim() }),
        ...(f.opensAt && { opensAt: f.opensAt }),
        ...(f.closesAt && { closesAt: f.closesAt }),
        isActive: f.isActive,
      };
      return point
        ? api<AdminMarket>(ADMIN_ENDPOINTS.pickupPoints.byId(point.id), { method: 'PATCH', body })
        : api<AdminMarket>(ADMIN_ENDPOINTS.markets.pickupPoints(market.id), {
            method: 'POST',
            body,
          });
    },
    onSuccess: m => {
      onSaved(m);
      toast.success(point ? 'Desk updated' : 'Desk added');
      onClose();
    },
  });
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{point ? 'Edit pickup desk' : 'New pickup desk'}</DialogTitle>
          <DialogDescription>Shown to customers at checkout and on their order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="pp-name">
            <Input
              id="pp-name"
              value={f.nameEn}
              onChange={e => setF({ ...f, nameEn: e.target.value })}
              placeholder="Main Gate Pickup Desk"
            />
          </Field>
          <Field label="নাম (বাংলা)" htmlFor="pp-bn">
            <Input
              id="pp-bn"
              lang="bn"
              value={f.nameBn}
              onChange={e => setF({ ...f, nameBn: e.target.value })}
            />
          </Field>
          <Field label="Floor" htmlFor="pp-floor">
            <NativeSelect
              id="pp-floor"
              value={f.floorId}
              onChange={e => setF({ ...f, floorId: e.target.value })}
            >
              <option value="">—</option>
              {[...market.floors]
                .sort((a, b) => a.level - b.level)
                .map(fl => (
                  <option key={fl.id} value={fl.id}>
                    {fl.nameEn}
                  </option>
                ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Opens" htmlFor="pp-open">
              <Input
                id="pp-open"
                type="time"
                value={f.opensAt}
                onChange={e => setF({ ...f, opensAt: e.target.value })}
              />
            </Field>
            <Field label="Closes" htmlFor="pp-close">
              <Input
                id="pp-close"
                type="time"
                value={f.closesAt}
                onChange={e => setF({ ...f, closesAt: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Directions for customers" htmlFor="pp-instr" className="sm:col-span-2">
            <Textarea
              id="pp-instr"
              rows={2}
              value={f.instructions}
              onChange={e => setF({ ...f, instructions: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-3">
            <Switch checked={f.isActive} onCheckedChange={v => setF({ ...f, isActive: v })} />
            <span className="text-sm">Accepting orders</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !f.nameEn.trim()}>
            <Check /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------ members

function MembersManager({
  market,
  onChange,
  editable,
}: {
  market: AdminMarket;
  onChange: (m: AdminMarket) => void;
  editable: boolean;
}) {
  const [f, setF] = useState({ phone: '', fullName: '', role: 'manager' });
  const add = useMutation({
    mutationFn: () =>
      api<AdminMarket>(ADMIN_ENDPOINTS.markets.members(market.id), {
        method: 'POST',
        body: {
          phone: f.phone.trim(),
          role: f.role,
          ...(f.fullName.trim() && { fullName: f.fullName.trim() }),
        },
      }),
    onSuccess: m => {
      onChange(m);
      setF({ phone: '', fullName: '', role: 'manager' });
      toast.success('Member added');
    },
  });
  const remove = useMutation({
    mutationFn: (userId: number) =>
      api<AdminMarket>(ADMIN_ENDPOINTS.markets.memberById(market.id, userId), { method: 'DELETE' }),
    onSuccess: m => {
      onChange(m);
      toast.success('Member removed');
    },
  });

  return (
    <Panel title="Market management" action={<UserPlus className="size-4 text-muted-foreground" />}>
      <p className="mb-3 text-xs text-muted-foreground">
        Mall admins see their market’s dashboard; desk staff hand over pickup-desk orders.
      </p>
      {market.members?.length ? (
        <ul className="mb-4 divide-y rounded-lg border">
          {market.members.map(m => (
            <li key={m.userId} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.user.fullName ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(m.user.phone)}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {humanize(m.role)}
              </span>
              {editable ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove member"
                  onClick={() => {
                    if (confirm(`Remove ${m.user.fullName ?? m.user.phone} from ${market.nameEn}?`))
                      remove.mutate(m.userId);
                  }}
                >
                  <X />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">No management members yet.</p>
      )}
      {editable ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            add.mutate();
          }}
          className="grid gap-2 rounded-lg border border-dashed p-3"
        >
          <p className="text-sm font-medium">Add member</p>
          <Input
            required
            inputMode="tel"
            placeholder="Mobile 01XXXXXXXXX"
            value={f.phone}
            onChange={e => setF({ ...f, phone: e.target.value })}
            aria-label="Mobile number"
          />
          <Input
            placeholder="Name (if new)"
            value={f.fullName}
            onChange={e => setF({ ...f, fullName: e.target.value })}
            aria-label="Name"
          />
          <NativeSelect
            value={f.role}
            onChange={e => setF({ ...f, role: e.target.value })}
            aria-label="Role"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="desk_staff">Desk staff</option>
          </NativeSelect>
          <Button type="submit" size="sm" className="w-fit" disabled={add.isPending}>
            <UserPlus /> Add
          </Button>
        </form>
      ) : null}
    </Panel>
  );
}
