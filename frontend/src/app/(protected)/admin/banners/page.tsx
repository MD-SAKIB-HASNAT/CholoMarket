/* eslint-disable @next/next/no-img-element */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GalleryHorizontal, ImageOff, LoaderCircle, Pause, Pencil, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { StatusBadge } from '@/components/shared/Bits';
import { Field, ImageUploader, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { toLocalInput, useAdminRole } from '@/app/(protected)/admin/utils/admin';
import type { AdminBanner } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

const KEY = ['admin', 'banners'];

const PLACEMENT_LABEL: Record<string, string> = {
  home_banner: 'Home page slider',
  market_featured: 'Mall page feature',
};

// The shared StatusBadge has no colour for campaign states.
const TONE: Record<string, string> = {
  running: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  scheduled: 'bg-sky-50 text-sky-800 border-sky-200',
  ended: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export default function BannersPage() {
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const editable = can('banners');
  const [editing, setEditing] = useState<AdminBanner | 'new' | null>(null);
  const [now] = useState(() => Date.now());
  const list = useCursorList<AdminBanner>(KEY, ADMIN_ENDPOINTS.banners.list, { limit: 20 });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api<AdminBanner>(ADMIN_ENDPOINTS.banners.byId(id), { method: 'PATCH', body: { status } }),
    onSuccess: b => {
      toast.success(b.status === 'running' ? 'Banner is running' : 'Banner paused');
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: e => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Banners"
        description="The big pictures at the top of the home page and mall pages. Running banners show between their start and end dates."
        actions={
          editable ? (
            <Button onClick={() => setEditing('new')}>
              <Plus /> New banner
            </Button>
          ) : null
        }
      />
      <Panel>
        <QueryState
          isLoading={list.isPending}
          error={list.error}
          emptyIcon={GalleryHorizontal}
          emptyTitle="No banners"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Image</TableHead>
                  <TableHead>Banner</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Runs</TableHead>
                  <TableHead>Status</TableHead>
                  {editable ? (
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.length ? (
                  list.items.map(b => {
                    const live =
                      b.status === 'running' &&
                      new Date(b.startsAt).getTime() <= now &&
                      new Date(b.endsAt).getTime() > now;
                    const paused = b.status === 'draft' || b.status === 'cancelled';
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="aspect-[16/7] w-32 overflow-hidden rounded-md border bg-muted">
                            {b.imageUrl ? (
                              <img
                                src={b.imageUrl}
                                alt=""
                                className="size-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="flex size-full items-center justify-center text-muted-foreground">
                                <ImageOff className="size-4" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-64">
                          <p className="truncate font-medium">{b.title ?? 'Untitled'}</p>
                          {b.subtitle ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {b.subtitle}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {PLACEMENT_LABEL[b.placement] ?? b.placement}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-48 truncate font-mono text-xs">
                          {b.linkUrl ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(b.startsAt)} → {formatDate(b.endsAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} className={TONE[b.status]} />
                          {live ? (
                            <p className="mt-1 text-[11px] text-emerald-700">Live now</p>
                          ) : null}
                        </TableCell>
                        {editable ? (
                          <TableCell className="text-right whitespace-nowrap">
                            {paused ? (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={setStatus.isPending}
                                onClick={() => setStatus.mutate({ id: b.id, status: 'running' })}
                              >
                                <Play /> Run
                              </Button>
                            ) : b.status !== 'ended' ? (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={setStatus.isPending}
                                onClick={() => setStatus.mutate({ id: b.id, status: 'draft' })}
                              >
                                <Pause /> Pause
                              </Button>
                            ) : null}
                            <Button
                              size="xs"
                              variant="ghost"
                              className="ml-1"
                              onClick={() => setEditing(b)}
                            >
                              <Pencil /> Edit
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })
                ) : (
                  <EmptyRow colSpan={editable ? 6 : 5}>
                    No banners yet. Add one to brighten up the home page.
                  </EmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ListFoot
            shown={list.items.length}
            noun="banner"
            hasMore={!!list.hasMore}
            loading={list.isLoadingMore}
            onLoad={list.loadMore}
          />
        </QueryState>
      </Panel>
      {editing ? (
        <BannerDialog
          key={editing === 'new' ? 'new' : editing.id}
          banner={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function BannerDialog({ banner, onClose }: { banner: AdminBanner | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState(() => ({
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    imageUrl: banner?.imageUrl ?? '',
    mobileImageUrl: banner?.mobileImageUrl ?? '',
    imageHasText: banner?.imageHasText ?? false,
    linkUrl: banner?.linkUrl ?? '/',
    placement: banner?.placement ?? 'home_banner',
    startsAt: toLocalInput(banner?.startsAt ?? new Date()),
    endsAt: toLocalInput(banner?.endsAt ?? new Date(Date.now() + 30 * 86_400_000)),
    status: banner?.status ?? 'running',
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(s => ({ ...s, [k]: v }));

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: f.title.trim(),
        subtitle: f.subtitle.trim() || (banner ? null : undefined),
        imageUrl: f.imageUrl.trim(),
        mobileImageUrl: f.mobileImageUrl.trim() || (banner ? null : undefined),
        imageHasText: f.imageHasText,
        linkUrl: f.linkUrl.trim(),
        placement: f.placement,
        startsAt: new Date(f.startsAt).toISOString(),
        endsAt: new Date(f.endsAt).toISOString(),
        status: f.status,
      };
      return banner
        ? api<AdminBanner>(ADMIN_ENDPOINTS.banners.byId(banner.id), { method: 'PATCH', body })
        : api<AdminBanner>(ADMIN_ENDPOINTS.banners.list, { method: 'POST', body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(banner ? 'Banner saved' : 'Banner created');
      onClose();
    },
    onError: e => toast.error(e.message),
  });

  const invalidDates = !f.startsAt || !f.endsAt || new Date(f.endsAt) <= new Date(f.startsAt);
  const canSave =
    f.title.trim().length >= 3 && !!f.imageUrl.trim() && !!f.linkUrl.trim() && !invalidDates;

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{banner ? 'Edit banner' : 'New banner'}</DialogTitle>
          <DialogDescription>
            Use a wide image (16:5, e.g. 2400×750) and, for phones, a 3:2 one (e.g. 1200×800). Keep
            the title short — it sits on top of the picture unless the artwork already shows its own
            headline.
          </DialogDescription>
        </DialogHeader>
        <form
          id="banner-form"
          className="grid max-h-[65vh] gap-3 overflow-y-auto pr-1"
          onSubmit={e => {
            e.preventDefault();
            if (canSave) save.mutate();
          }}
        >
          <Field label="Title" htmlFor="bn-title">
            <Input
              id="bn-title"
              value={f.title}
              minLength={3}
              maxLength={80}
              required
              onChange={e => set('title', e.target.value)}
              placeholder="Eid collection is in"
            />
          </Field>
          <Field label="Subtitle" htmlFor="bn-sub">
            <Input
              id="bn-sub"
              value={f.subtitle}
              maxLength={200}
              onChange={e => set('subtitle', e.target.value)}
              placeholder="Panjabi, saree and shoes from 40 shops"
            />
          </Field>
          <Field label="Image">
            <div className="grid gap-2">
              <ImageUploader
                value={f.imageUrl ? [f.imageUrl] : []}
                onChange={v => set('imageUrl', v[0] ?? '')}
                max={1}
              />
              <Input
                aria-label="Image URL"
                placeholder="…or paste an image URL (https://… or /banners/…)"
                value={f.imageUrl}
                onChange={e => set('imageUrl', e.target.value)}
              />
            </div>
          </Field>
          <Field
            label="Phone image (optional)"
            htmlFor="bn-mobile"
            hint="A taller 3:2 version for phones. Leave empty to crop the wide image."
          >
            <Input
              id="bn-mobile"
              value={f.mobileImageUrl}
              onChange={e => set('mobileImageUrl', e.target.value)}
              placeholder="https://… or /banners/…"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={f.imageHasText}
              onCheckedChange={v => set('imageHasText', !!v)}
              className="mt-0.5"
            />
            <span>
              The image already shows the headline
              <span className="block text-xs text-muted-foreground">
                Then the site shows the artwork as it is, without writing the title over it.
              </span>
            </span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Link"
              htmlFor="bn-link"
              hint="A page on the site, e.g. /markets/bashundhara-city"
            >
              <Input
                id="bn-link"
                className="font-mono"
                value={f.linkUrl}
                maxLength={200}
                required
                onChange={e => set('linkUrl', e.target.value)}
              />
            </Field>
            <Field label="Where" htmlFor="bn-place">
              <NativeSelect
                id="bn-place"
                value={f.placement}
                onChange={e => set('placement', e.target.value)}
              >
                <option value="home_banner">Home page slider</option>
                <option value="market_featured">Mall page feature</option>
              </NativeSelect>
            </Field>
            <Field label="Starts" htmlFor="bn-start">
              <Input
                id="bn-start"
                type="datetime-local"
                value={f.startsAt}
                required
                onChange={e => set('startsAt', e.target.value)}
              />
            </Field>
            <Field label="Ends" htmlFor="bn-end">
              <Input
                id="bn-end"
                type="datetime-local"
                value={f.endsAt}
                required
                onChange={e => set('endsAt', e.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="bn-status">
              <NativeSelect
                id="bn-status"
                value={f.status}
                onChange={e => set('status', e.target.value)}
              >
                <option value="running">Running</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Paused (draft)</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </NativeSelect>
            </Field>
          </div>
          {invalidDates && f.startsAt && f.endsAt ? (
            <p className="text-xs text-destructive">The end must be after the start.</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="banner-form" disabled={!canSave || save.isPending}>
            {save.isPending ? <LoaderCircle className="animate-spin" /> : null}{' '}
            {banner ? 'Save banner' : 'Create banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
