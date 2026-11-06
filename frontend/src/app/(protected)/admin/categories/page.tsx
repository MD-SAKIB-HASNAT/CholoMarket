'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Layers, Pencil, Plus } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { Bn } from '@/components/shared/Bits';
import { CATEGORY_ICON_NAMES, CategoryIcon } from '@/components/shared/CategoryIcon';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import type { Category } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import { groupCategories, useAdminCategories } from '@/app/(protected)/admin/utils/hooks';
import { QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function CategoriesPage() {
  const { can } = useAdminRole();
  const editable = can('categories');
  const qc = useQueryClient();
  const { data, isLoading, error } = useAdminCategories();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  const toggle = useMutation({
    mutationFn: (c: Category) =>
      api<Category>(ADMIN_ENDPOINTS.categories.byId(c.id), {
        method: 'PATCH',
        body: { nameEn: c.nameEn, nameBn: c.nameBn, isActive: !c.isActive },
      }),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast.success(`${c.nameEn} ${c.isActive ? 'shown' : 'hidden'}`);
    },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="The category tree used for search filters, shop listings and commission rules."
        actions={
          editable ? (
            <Button onClick={() => setEditing('new')}>
              <Plus /> New category
            </Button>
          ) : null
        }
      />
      <QueryState
        isLoading={isLoading}
        error={error}
        empty={!data?.length}
        emptyIcon={Layers}
        emptyTitle="No categories yet"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupCategories(data).map(({ parent, children }) => (
            <Panel key={parent.id} className={cn(!parent.isActive && 'opacity-60')}>
              <CategoryRow
                c={parent}
                editable={editable}
                onEdit={setEditing}
                onToggle={c => toggle.mutate(c)}
                parent
              />
              <ul className="mt-2 grid gap-1 border-l pl-3">
                {children.map(c => (
                  <li key={c.id} className={cn(!c.isActive && 'opacity-60')}>
                    <CategoryRow
                      c={c}
                      editable={editable}
                      onEdit={setEditing}
                      onToggle={cc => toggle.mutate(cc)}
                    />
                  </li>
                ))}
                {!children.length ? (
                  <li className="text-xs text-muted-foreground">No sub-categories</li>
                ) : null}
              </ul>
            </Panel>
          ))}
        </div>
      </QueryState>
      {editing ? (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          all={data ?? []}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function CategoryRow({
  c,
  editable,
  parent,
  onEdit,
  onToggle,
}: {
  c: Category;
  editable: boolean;
  parent?: boolean;
  onEdit: (c: Category) => void;
  onToggle: (c: Category) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground',
          parent ? 'size-9' : 'size-7'
        )}
      >
        <CategoryIcon name={c.icon} className={parent ? 'size-4.5' : 'size-3.5'} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate', parent ? 'font-semibold' : 'text-sm')}>{c.nameEn}</p>
        <p className="truncate text-xs text-muted-foreground">
          <Bn className="text-xs">{c.nameBn}</Bn> · /{c.slug} · #{c.sortOrder}
        </p>
      </div>
      {editable ? (
        <>
          <Switch
            size="sm"
            checked={c.isActive}
            onCheckedChange={() => onToggle(c)}
            aria-label={c.isActive ? `Hide ${c.nameEn}` : `Show ${c.nameEn}`}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${c.nameEn}`}
            onClick={() => onEdit(c)}
          >
            <Pencil />
          </Button>
        </>
      ) : null}
    </div>
  );
}

function CategoryDialog({
  category,
  all,
  onClose,
}: {
  category: Category | null;
  all: Category[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    nameEn: category?.nameEn ?? '',
    nameBn: category?.nameBn ?? '',
    slug: category?.slug ?? '',
    parentId: category?.parentId ? String(category.parentId) : '',
    icon: category?.icon ?? '',
    sortOrder: String(category?.sortOrder ?? 0),
    isActive: category?.isActive ?? true,
  });
  const save = useMutation({
    mutationFn: () => {
      const body = {
        nameEn: f.nameEn.trim(),
        nameBn: f.nameBn.trim(),
        ...(f.slug.trim() && { slug: f.slug.trim() }),
        parentId: f.parentId ? Number(f.parentId) : null,
        ...(f.icon && { icon: f.icon }),
        sortOrder: Number(f.sortOrder) || 0,
        isActive: f.isActive,
      };
      return category
        ? api<Category>(ADMIN_ENDPOINTS.categories.byId(category.id), { method: 'PATCH', body })
        : api<Category>(ADMIN_ENDPOINTS.categories.list, { method: 'POST', body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast.success(category ? 'Category saved' : 'Category created');
      onClose();
    },
  });
  const parents = all.filter(c => !c.parentId && c.id !== category?.id);

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? `Edit ${category.nameEn}` : 'New category'}</DialogTitle>
          <DialogDescription>Leave parent empty for a top-level category.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name (English)" htmlFor="c-en">
            <Input
              id="c-en"
              value={f.nameEn}
              onChange={e => setF({ ...f, nameEn: e.target.value })}
            />
          </Field>
          <Field label="নাম (বাংলা)" htmlFor="c-bn">
            <Input
              id="c-bn"
              lang="bn"
              value={f.nameBn}
              onChange={e => setF({ ...f, nameBn: e.target.value })}
            />
          </Field>
          <Field label="Slug" htmlFor="c-slug" hint="Generated from the name if empty.">
            <Input
              id="c-slug"
              value={f.slug}
              onChange={e => setF({ ...f, slug: e.target.value })}
            />
          </Field>
          <Field label="Parent" htmlFor="c-parent">
            <NativeSelect
              id="c-parent"
              value={f.parentId}
              onChange={e => setF({ ...f, parentId: e.target.value })}
            >
              <option value="">— Top level —</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nameEn}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Sort order" htmlFor="c-sort">
            <Input
              id="c-sort"
              type="number"
              value={f.sortOrder}
              onChange={e => setF({ ...f, sortOrder: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-3 self-end pb-1.5">
            <Switch checked={f.isActive} onCheckedChange={v => setF({ ...f, isActive: v })} />
            <span className="text-sm">Visible</span>
          </label>
          <Field label="Icon" className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_ICON_NAMES.map(name => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  aria-label={name}
                  aria-pressed={f.icon === name}
                  onClick={() => setF({ ...f, icon: name })}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg border hover:bg-muted',
                    f.icon === name && 'border-primary bg-primary/10 text-primary'
                  )}
                >
                  <CategoryIcon name={name} className="size-4" />
                </button>
              ))}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || !f.nameEn.trim() || !f.nameBn.trim()}
          >
            <Check /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
