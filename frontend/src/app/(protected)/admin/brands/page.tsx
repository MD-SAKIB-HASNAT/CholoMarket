/* eslint-disable @next/next/no-img-element */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageOff, LoaderCircle, Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { Field, ImageUploader } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import type { AdminBrand } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

const KEY = ['admin', 'brands'];

export default function BrandsPage() {
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const editable = can('brands');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminBrand | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminBrand | null>(null);
  const list = useCursorList<AdminBrand>(KEY, ADMIN_ENDPOINTS.brands.list, {
    q: search,
    limit: 30,
  });

  const remove = useMutation({
    mutationFn: (brand: AdminBrand) =>
      api(ADMIN_ENDPOINTS.brands.byId(brand.id), { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Brand deleted');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: KEY });
    },
    // e.g. "3 products use this brand. Change them first."
    onError: e => {
      toast.error(e.message);
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Brands"
        description="The brands shops attach to their products. Customers can filter the product list by brand; a brand shows there once it has products on sale."
        actions={
          editable ? (
            <Button onClick={() => setEditing('new')}>
              <Plus /> New brand
            </Button>
          ) : null
        }
      />
      <Panel>
        <form
          className="relative mb-4 max-w-md"
          onSubmit={e => {
            e.preventDefault();
            setSearch(text.trim());
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Find a brand, press Enter"
            className="pl-8"
            aria-label="Search brands"
          />
        </form>
        <QueryState
          isLoading={list.isPending}
          error={list.error}
          emptyIcon={Tag}
          emptyTitle="No brands"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Products</TableHead>
                {editable ? <TableHead className="w-0" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length ? (
                list.items.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {b.logoUrl ? (
                          <img
                            src={b.logoUrl}
                            alt=""
                            className="size-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <ImageOff className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {b.slug}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.productCount}</TableCell>
                    {editable ? (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Edit ${b.name}`}
                            onClick={() => setEditing(b)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-deal"
                            aria-label={`Delete ${b.name}`}
                            onClick={() => setDeleting(b)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <EmptyRow colSpan={editable ? 5 : 4}>
                  {search ? 'No brand matches.' : 'No brands yet.'}
                </EmptyRow>
              )}
            </TableBody>
          </Table>
          <ListFoot
            shown={list.items.length}
            noun="brand"
            hasMore={!!list.hasMore}
            loading={list.isLoadingMore}
            onLoad={list.loadMore}
          />
        </QueryState>
      </Panel>

      {editing ? (
        <BrandDialog
          key={editing === 'new' ? 'new' : editing.id}
          brand={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              A brand can only be deleted when no product uses it.
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

function BrandDialog({ brand, onClose }: { brand: AdminBrand | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(brand?.name ?? '');
  const [slug, setSlug] = useState(brand?.slug ?? '');
  const [logoUrl, setLogoUrl] = useState(brand?.logoUrl ?? '');

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        ...(slug.trim() && { slug: slug.trim() }),
        ...(logoUrl.trim() && { logoUrl: logoUrl.trim() }),
      };
      return brand
        ? api(ADMIN_ENDPOINTS.brands.byId(brand.id), { method: 'PATCH', body })
        : api(ADMIN_ENDPOINTS.brands.list, { method: 'POST', body });
    },
    onSuccess: () => {
      toast.success(brand ? 'Brand saved' : 'Brand created');
      qc.invalidateQueries({ queryKey: KEY });
      onClose();
    },
    onError: e => toast.error(e.message),
  });
  const canSave = name.trim().length >= 2;

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit brand' : 'New brand'}</DialogTitle>
          <DialogDescription>
            The name shoppers see in the Brand filter. The slug is made from the name if you leave
            it empty.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={e => {
            e.preventDefault();
            if (canSave) save.mutate();
          }}
        >
          <Field label="Name" htmlFor="br-name">
            <Input
              id="br-name"
              value={name}
              minLength={2}
              maxLength={60}
              required
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Aarong"
              autoFocus
            />
          </Field>
          <Field label="Slug (optional)" htmlFor="br-slug">
            <Input
              id="br-slug"
              className="font-mono"
              value={slug}
              maxLength={80}
              onChange={e => setSlug(e.target.value)}
              placeholder="aarong"
            />
          </Field>
          <Field label="Logo (optional)">
            <div className="grid gap-2">
              <ImageUploader
                value={logoUrl ? [logoUrl] : []}
                onChange={v => setLogoUrl(v[0] ?? '')}
                max={1}
              />
              <Input
                aria-label="Logo URL"
                placeholder="…or paste an image URL (https://…)"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
              />
            </div>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || save.isPending}>
              {save.isPending ? <LoaderCircle className="animate-spin" /> : null}{' '}
              {brand ? 'Save' : 'Create brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
