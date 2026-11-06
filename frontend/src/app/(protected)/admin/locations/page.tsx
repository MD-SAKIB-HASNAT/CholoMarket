'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, LoaderCircle, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { Bn } from '@/components/shared/Bits';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { humanize } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import {
  EMPTY_LOCATION,
  LocationSelects,
  type LocationValue,
} from '@/app/(protected)/admin/components/LocationPicker';
import type { GeoLevel, GeoRow } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

const LEVELS: {
  value: GeoLevel;
  tab: string;
  singular: string;
  /** Levels of cascading selects for the filters / the parent picker (0 = none, it is the top level). */
  parentDepth: number;
  parent?: string;
  children: string;
}[] = [
  {
    value: 'divisions',
    tab: 'Divisions',
    singular: 'division',
    parentDepth: 0,
    children: 'Districts',
  },
  {
    value: 'districts',
    tab: 'Districts',
    singular: 'district',
    parentDepth: 1,
    parent: 'division',
    children: 'Areas',
  },
  {
    value: 'areas',
    tab: 'Areas',
    singular: 'area',
    parentDepth: 2,
    parent: 'district',
    children: 'Sub-areas',
  },
  {
    value: 'sub-areas',
    tab: 'Sub-areas',
    singular: 'sub-area',
    parentDepth: 3,
    parent: 'area',
    children: '',
  },
];

const AREA_KINDS = ['thana', 'upazila', 'city_area'];

/** The id of the parent in a LocationValue, for a level. */
function parentIdOf(level: GeoLevel, loc: LocationValue) {
  return level === 'districts'
    ? loc.divisionId
    : level === 'areas'
      ? loc.districtId
      : level === 'sub-areas'
        ? loc.areaId
        : '';
}

/** A row's own place in the chain, as picker values (so editing starts on the current parents). */
function locationOfRow(row: GeoRow): LocationValue {
  return {
    divisionId: row.divisionId ? String(row.divisionId) : '',
    districtId: row.districtId ? String(row.districtId) : '',
    areaId: row.areaId ? String(row.areaId) : '',
    subAreaId: '',
  };
}

export default function LocationsPage() {
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const editable = can('locations');
  const [level, setLevel] = useState<GeoLevel>('divisions');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<LocationValue>(EMPTY_LOCATION);
  const [editing, setEditing] = useState<GeoRow | 'new' | null>(null);
  const [deleting, setDeleting] = useState<GeoRow | null>(null);
  const cfg = LEVELS.find(l => l.value === level)!;

  const list = useCursorList<GeoRow>(['admin', 'geo', level], ADMIN_ENDPOINTS.geo.list(level), {
    q: q.trim(),
    divisionId: cfg.parentDepth >= 1 ? filters.divisionId : '',
    districtId: cfg.parentDepth >= 2 ? filters.districtId : '',
    areaId: cfg.parentDepth >= 3 ? filters.areaId : '',
    limit: 50,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'geo'] });
    qc.invalidateQueries({ queryKey: ['geo'] });
  };
  const toggle = useMutation({
    mutationFn: (row: GeoRow) =>
      api<GeoRow>(ADMIN_ENDPOINTS.geo.byId(level, row.id), {
        method: 'PATCH',
        body: { isActive: !row.isActive },
      }),
    onSuccess: row => {
      toast.success(
        row.isActive ? `${row.nameEn} is visible again` : `${row.nameEn} is hidden from customers`
      );
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (row: GeoRow) => api(ADMIN_ENDPOINTS.geo.byId(level, row.id), { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Deleted');
      setDeleting(null);
      refresh();
    },
    onError: e => {
      toast.error(e.message);
      setDeleting(null);
    },
  });

  const changeLevel = (next: GeoLevel) => {
    setLevel(next);
    setQ('');
  };
  const rows = list.items;
  const columns =
    3 +
    (cfg.parentDepth ? 1 : 0) +
    (level === 'areas' ? 1 : 0) +
    (cfg.children ? 1 : 0) +
    (editable ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Locations"
        description="Division → district → area → sub-area. Markets pick their place from these lists, and customers filter malls, markets and shops by them. Hide a place to remove it from the pickers without deleting it."
        actions={
          editable ? (
            <Button onClick={() => setEditing('new')}>
              <Plus /> Add {cfg.singular}
            </Button>
          ) : null
        }
      />
      <Panel>
        <Tabs value={level} onValueChange={v => changeLevel(v as GeoLevel)} className="mb-4">
          <TabsList>
            {LEVELS.map(l => (
              <TabsTrigger key={l.value} value={l.value}>
                {l.tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-end">
          <Field label="Search" htmlFor="geo-q">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="geo-q"
                className="pl-8"
                placeholder={`Find a ${cfg.singular}`}
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </Field>
          {cfg.parentDepth ? (
            <LocationSelects
              key={level}
              value={filters}
              onChange={setFilters}
              depth={cfg.parentDepth}
              source="admin"
              idPrefix="geo-filter"
              className={
                cfg.parentDepth === 1
                  ? 'grid gap-3 sm:max-w-xs'
                  : cfg.parentDepth === 2
                    ? 'grid gap-3 sm:grid-cols-2'
                    : 'grid gap-3 sm:grid-cols-3'
              }
            />
          ) : null}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {cfg.parentDepth ? <TableHead>Belongs to</TableHead> : null}
              {level === 'areas' ? <TableHead>Type</TableHead> : null}
              {cfg.children ? <TableHead className="text-right">{cfg.children}</TableHead> : null}
              <TableHead className="text-right">Markets</TableHead>
              <TableHead>Status</TableHead>
              {editable ? <TableHead className="w-0" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isPending ? (
              <EmptyRow colSpan={columns}>Loading…</EmptyRow>
            ) : list.error ? (
              <EmptyRow colSpan={columns}>{list.error.message}</EmptyRow>
            ) : !rows.length ? (
              <EmptyRow colSpan={columns}>
                <MapPin className="mx-auto mb-2 size-5" />
                No {cfg.tab.toLowerCase()} match.
              </EmptyRow>
            ) : (
              rows.map(row => (
                <TableRow key={row.id} className={row.isActive ? undefined : 'opacity-60'}>
                  <TableCell>
                    <span className="font-medium">{row.nameEn}</span>
                    <Bn className="block text-xs">{row.nameBn}</Bn>
                  </TableCell>
                  {cfg.parentDepth ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {row.parentPath}
                    </TableCell>
                  ) : null}
                  {level === 'areas' ? (
                    <TableCell className="text-sm">
                      {humanize(row.kind ?? 'thana')}
                      {row.isServiceable ? (
                        <Badge variant="secondary" className="ml-2">
                          Delivery
                        </Badge>
                      ) : null}
                    </TableCell>
                  ) : null}
                  {cfg.children ? (
                    <TableCell className="text-right tabular-nums">{row.childCount}</TableCell>
                  ) : null}
                  <TableCell className="text-right tabular-nums">{row.marketCount}</TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? 'secondary' : 'outline'}>
                      {row.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  {editable ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Edit ${row.nameEn}`}
                          onClick={() => setEditing(row)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={row.isActive ? `Hide ${row.nameEn}` : `Show ${row.nameEn}`}
                          disabled={toggle.isPending}
                          onClick={() => toggle.mutate(row)}
                        >
                          {row.isActive ? <EyeOff /> : <Eye />}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-deal"
                          aria-label={`Delete ${row.nameEn}`}
                          onClick={() => setDeleting(row)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ListFoot
          shown={rows.length}
          noun={cfg.singular}
          hasMore={!!list.hasMore}
          loading={list.isLoadingMore}
          onLoad={list.loadMore}
        />
      </Panel>

      {editing ? (
        <GeoDialog
          key={`${level}:${editing === 'new' ? 'new' : editing.id}`}
          level={level}
          row={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      ) : null}

      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.nameEn}?</DialogTitle>
            <DialogDescription>
              This removes the {cfg.singular} for good. It can only be deleted when it has nothing
              under it and no market is located in it; otherwise hide it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting)}
            >
              {remove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GeoDialog({
  level,
  row,
  onClose,
  onSaved,
}: {
  level: GeoLevel;
  row: GeoRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cfg = LEVELS.find(l => l.value === level)!;
  const [f, setF] = useState(() => ({
    nameEn: row?.nameEn ?? '',
    nameBn: row?.nameBn ?? '',
    kind: row?.kind ?? 'thana',
    isServiceable: row?.isServiceable ?? false,
    isActive: row?.isActive ?? true,
  }));
  const [loc, setLoc] = useState<LocationValue>(() => (row ? locationOfRow(row) : EMPTY_LOCATION));
  const parentId = parentIdOf(level, loc);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        nameEn: f.nameEn.trim(),
        nameBn: f.nameBn.trim(),
        isActive: f.isActive,
        ...(cfg.parentDepth && { parentId: Number(parentId) }),
        ...(level === 'areas' && { kind: f.kind, isServiceable: f.isServiceable }),
      };
      return row
        ? api<GeoRow>(ADMIN_ENDPOINTS.geo.byId(level, row.id), { method: 'PATCH', body })
        : api<GeoRow>(ADMIN_ENDPOINTS.geo.list(level), { method: 'POST', body });
    },
    onSuccess: saved => {
      toast.success(row ? `${saved.nameEn} saved` : `${saved.nameEn} added`);
      onSaved();
      onClose();
    },
    onError: e => toast.error(e.message),
  });

  const canSave =
    f.nameEn.trim().length >= 2 && f.nameBn.trim().length >= 1 && (!cfg.parentDepth || !!parentId);

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? `Edit ${cfg.singular}` : `Add a ${cfg.singular}`}</DialogTitle>
          <DialogDescription>
            {cfg.parent
              ? `Every ${cfg.singular} belongs to a ${cfg.parent}${cfg.parentDepth > 1 ? ', so choose the whole chain above it' : ''}.`
              : 'Divisions are the top level.'}
          </DialogDescription>
        </DialogHeader>
        <form
          id="geo-form"
          className="grid gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (canSave) save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)" htmlFor="geo-name-en">
              <Input
                id="geo-name-en"
                required
                minLength={2}
                maxLength={100}
                value={f.nameEn}
                onChange={e => setF({ ...f, nameEn: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="নাম (বাংলা)" htmlFor="geo-name-bn">
              <Input
                id="geo-name-bn"
                lang="bn"
                required
                maxLength={100}
                value={f.nameBn}
                onChange={e => setF({ ...f, nameBn: e.target.value })}
              />
            </Field>
          </div>
          {cfg.parentDepth ? (
            <LocationSelects
              value={loc}
              onChange={setLoc}
              depth={cfg.parentDepth}
              required={cfg.parentDepth}
              source="admin"
              idPrefix="geo-parent"
            />
          ) : null}
          {level === 'areas' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor="geo-kind">
                <NativeSelect
                  id="geo-kind"
                  value={f.kind}
                  onChange={e => setF({ ...f, kind: e.target.value })}
                >
                  {AREA_KINDS.map(k => (
                    <option key={k} value={k}>
                      {humanize(k)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <label className="flex items-center gap-3 self-end pb-2 text-sm">
                <Switch
                  checked={f.isServiceable}
                  onCheckedChange={v => setF({ ...f, isServiceable: v })}
                />
                Delivery covered
              </label>
            </div>
          ) : null}
          {row ? (
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={f.isActive} onCheckedChange={v => setF({ ...f, isActive: v })} />
              Visible to customers and in the pickers
            </label>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="geo-form" disabled={!canSave || save.isPending}>
            {save.isPending ? <LoaderCircle className="animate-spin" /> : null}{' '}
            {row ? 'Save changes' : `Add ${cfg.singular}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
