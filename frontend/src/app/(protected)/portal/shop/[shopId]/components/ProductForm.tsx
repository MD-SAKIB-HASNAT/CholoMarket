'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Panel } from '@/components/dashboard/DashboardShell';
import { Field, ImageUploader, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import type { Category, Product } from '@/utils/types';
import { BrandPicker } from './BrandPicker';
import { shopBase } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

interface VariantRow {
  key: string;
  id?: number;
  size: string;
  color: string;
  otherKey: string;
  otherValue: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  minOfferPrice: string;
  stockQty: string;
  /** Live stock of existing variants (edited from the products list). */
  currentStock?: number;
}

let rowSeq = 0;
const newRow = (): VariantRow => ({
  key: `new-${++rowSeq}`,
  size: '',
  color: '',
  otherKey: '',
  otherValue: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  minOfferPrice: '',
  stockQty: '0',
});

function rowsFrom(product?: Product): VariantRow[] {
  const active = product?.variants.filter(v => v.isActive) ?? [];
  if (!active.length) return [newRow()];
  return active.map(v => {
    const { size = '', color = '', ...rest } = v.attributes ?? {};
    const [otherKey = '', otherValue = ''] = Object.entries(rest)[0] ?? [];
    return {
      key: `v-${v.id}`,
      id: v.id,
      size,
      color,
      otherKey,
      otherValue,
      sku: v.sku ?? '',
      price: String(v.price),
      compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : '',
      minOfferPrice: v.minOfferPrice ? String(v.minOfferPrice) : '',
      stockQty: String(v.stockQty),
      currentStock: v.stockQty,
    };
  });
}

const num = (s: string) => (s.trim() === '' ? null : Number(s));

/** The shop-portal product also carries its brand (not in the shared Product type). */
type ProductWithBrand = Product & {
  brandId?: number | null;
  brand?: { id: number; name: string } | null;
};

export function ProductForm({ shopId, product }: { shopId: number; product?: Product }) {
  const router = useRouter();
  const qc = useQueryClient();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>(PORTAL_ENDPOINTS.shared.categories, { token: null }),
  });

  const [categoryId, setCategoryId] = useState(product ? String(product.categoryId) : '');
  const [brandId, setBrandId] = useState(
    (product as ProductWithBrand | undefined)?.brandId?.toString() ?? ''
  );
  const [nameEn, setNameEn] = useState(product?.nameEn ?? '');
  const [nameBn, setNameBn] = useState(product?.nameBn ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [condition, setCondition] = useState<Product['condition']>(product?.condition ?? 'new');
  const [warrantyType, setWarrantyType] = useState<Product['warrantyType']>(
    product?.warrantyType ?? 'none'
  );
  const [warrantyMonths, setWarrantyMonths] = useState(
    product?.warrantyMonths ? String(product.warrantyMonths) : ''
  );
  const [isNegotiable, setIsNegotiable] = useState(product?.isNegotiable ?? false);
  const [status, setStatus] = useState<'draft' | 'active' | 'hidden'>(
    product && product.status !== 'archived' ? product.status : 'active'
  );
  const [images, setImages] = useState<string[]>(
    product ? [...product.images].sort((a, b) => a.sortOrder - b.sortOrder).map(i => i.url) : []
  );
  const [rows, setRows] = useState<VariantRow[]>(() => rowsFrom(product));

  const update = (key: string, patch: Partial<VariantRow>) =>
    setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const save = useMutation({
    mutationFn: (body: unknown) =>
      product
        ? api<Product>(PORTAL_ENDPOINTS.shop.product(shopId, product.id), { method: 'PUT', body })
        : api<Product>(PORTAL_ENDPOINTS.shop.products(shopId), { method: 'POST', body }),
    onSuccess: saved => {
      toast.success(product ? 'Product updated' : 'Product added');
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
      router.push(
        product ? `${shopBase(shopId)}/products` : `${shopBase(shopId)}/products/${saved.id}`
      );
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) return toast.error('Choose a category');
    const variants = [];
    for (const r of rows) {
      const price = num(r.price);
      if (price === null || Number.isNaN(price) || price < 0)
        return toast.error('Every variant needs a price');
      const compareAtPrice = num(r.compareAtPrice);
      const minOfferPrice = isNegotiable ? num(r.minOfferPrice) : null;
      if (minOfferPrice !== null && minOfferPrice >= price)
        return toast.error('Lowest offer must be below the price');
      const attributes: Record<string, string> = {};
      if (r.size.trim()) attributes.size = r.size.trim();
      if (r.color.trim()) attributes.color = r.color.trim();
      if (r.otherKey.trim() && r.otherValue.trim())
        attributes[r.otherKey.trim().toLowerCase()] = r.otherValue.trim();
      variants.push({
        ...(r.id && { id: r.id }),
        sku: r.sku.trim() || undefined,
        attributes,
        price,
        compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
        minOfferPrice,
        ...(!r.id && { stockQty: Math.max(0, Number.parseInt(r.stockQty || '0', 10) || 0) }),
      });
    }
    save.mutate({
      categoryId: Number(categoryId),
      brandId: brandId ? Number(brandId) : null,
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim() || null,
      description: description.trim() || null,
      condition,
      warrantyType,
      warrantyMonths: warrantyType !== 'none' && warrantyMonths ? Number(warrantyMonths) : null,
      isNegotiable,
      status,
      images,
      variants,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Basics">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (English)" htmlFor="nameEn">
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  required
                  minLength={2}
                  maxLength={150}
                />
              </Field>
              <Field
                label="নাম (বাংলা)"
                htmlFor="nameBn"
                hint="Helps customers who search in Bangla"
              >
                <Input
                  id="nameBn"
                  lang="bn"
                  value={nameBn}
                  onChange={e => setNameBn(e.target.value)}
                  maxLength={150}
                />
              </Field>
            </div>
            <Field label="Category" htmlFor="category">
              <NativeSelect
                id="category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
              >
                <option value="">Choose a category…</option>
                {(categories.data ?? []).map(root =>
                  root.children?.length ? (
                    <optgroup key={root.id} label={root.nameEn}>
                      {root.children.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nameEn} — {c.nameBn}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={root.id} value={root.id}>
                      {root.nameEn}
                    </option>
                  )
                )}
              </NativeSelect>
            </Field>
            <BrandPicker
              value={brandId}
              current={(product as ProductWithBrand | undefined)?.brand}
              onChange={setBrandId}
            />
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={5000}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Photos">
          <ImageUploader value={images} onChange={setImages} max={10} />
          <p className="mt-2 text-xs text-muted-foreground">
            The first photo is the cover. Clear, daylight photos sell best.
          </p>
        </Panel>

        <Panel
          title="Variants, price & stock"
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRows(rs => [...rs, newRow()])}
            >
              <Plus /> Add variant
            </Button>
          }
        >
          <div className="grid gap-4">
            {rows.map((r, i) => (
              <fieldset key={r.key} className="grid gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <legend className="text-sm font-medium">Variant {i + 1}</legend>
                  {rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove variant ${i + 1}`}
                      onClick={() => setRows(rs => rs.filter(x => x.key !== r.key))}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Size">
                    <Input
                      value={r.size}
                      onChange={e => update(r.key, { size: e.target.value })}
                      placeholder="M, 42, 8/128GB"
                    />
                  </Field>
                  <Field label="Colour">
                    <Input
                      value={r.color}
                      onChange={e => update(r.key, { color: e.target.value })}
                      placeholder="Black"
                    />
                  </Field>
                  <Field label="Other (name)">
                    <Input
                      value={r.otherKey}
                      onChange={e => update(r.key, { otherKey: e.target.value })}
                      placeholder="strap"
                    />
                  </Field>
                  <Field label="Other (value)">
                    <Input
                      value={r.otherValue}
                      onChange={e => update(r.key, { otherValue: e.target.value })}
                      placeholder="Leather"
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Price (৳)">
                    <Input
                      inputMode="decimal"
                      value={r.price}
                      onChange={e => update(r.key, { price: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Was (৳)" hint="Optional, shown crossed out">
                    <Input
                      inputMode="decimal"
                      value={r.compareAtPrice}
                      onChange={e => update(r.key, { compareAtPrice: e.target.value })}
                    />
                  </Field>
                  {r.id ? (
                    <Field label="Stock" hint="Change from the products list">
                      <Input value={r.currentStock ?? 0} disabled />
                    </Field>
                  ) : (
                    <Field label="Opening stock">
                      <Input
                        inputMode="numeric"
                        value={r.stockQty}
                        onChange={e =>
                          update(r.key, { stockQty: e.target.value.replace(/\D/g, '') })
                        }
                      />
                    </Field>
                  )}
                  <Field label="SKU">
                    <Input
                      value={r.sku}
                      onChange={e => update(r.key, { sku: e.target.value })}
                      maxLength={60}
                    />
                  </Field>
                </div>
                {isNegotiable ? (
                  <Field
                    label="Lowest offer you’ll accept (৳)"
                    hint="Hidden from customers. Offers below this are declined automatically."
                  >
                    <Input
                      inputMode="decimal"
                      value={r.minOfferPrice}
                      onChange={e => update(r.key, { minOfferPrice: e.target.value })}
                      className="sm:max-w-48"
                    />
                  </Field>
                ) : null}
              </fieldset>
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Visibility">
          <Field label="Status" htmlFor="status">
            <NativeSelect
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as typeof status)}
            >
              <option value="active">Active — customers can buy</option>
              <option value="hidden">Hidden</option>
              <option value="draft">Draft</option>
            </NativeSelect>
          </Field>
          <label className="mt-4 flex items-start justify-between gap-3">
            <span>
              <span className="block text-sm font-medium">Allow bargaining</span>
              <span className="block text-xs text-muted-foreground">
                Customers can send you a price offer.
              </span>
            </span>
            <Switch checked={isNegotiable} onCheckedChange={v => setIsNegotiable(v)} />
          </label>
        </Panel>
        <Panel title="Condition & warranty">
          <div className="grid gap-4">
            <Field label="Condition" htmlFor="condition">
              <NativeSelect
                id="condition"
                value={condition}
                onChange={e => setCondition(e.target.value as Product['condition'])}
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </NativeSelect>
            </Field>
            <Field label="Warranty" htmlFor="warranty">
              <NativeSelect
                id="warranty"
                value={warrantyType}
                onChange={e => setWarrantyType(e.target.value as Product['warrantyType'])}
              >
                <option value="none">No warranty</option>
                <option value="shop">Shop warranty</option>
                <option value="brand_official">Official brand warranty</option>
              </NativeSelect>
            </Field>
            {warrantyType !== 'none' ? (
              <Field label="Warranty months" htmlFor="months">
                <Input
                  id="months"
                  inputMode="numeric"
                  value={warrantyMonths}
                  onChange={e => setWarrantyMonths(e.target.value.replace(/\D/g, ''))}
                />
              </Field>
            ) : null}
          </div>
        </Panel>
        <Button type="submit" size="lg" className="h-10 w-full" disabled={save.isPending}>
          {save.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}{' '}
          {product ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </form>
  );
}
