'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Eye, EyeOff, Minus, Package, Pencil, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { NativeSelect } from '@/components/shared/FormBits';
import { LoadMore } from '@/components/shared/LoadMore';
import { Media } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { formatTaka, timeAgo, variantText } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Product, Variant } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import {
  shopBase,
  useShopId,
  useShopRole,
} from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

const STATUSES = [
  { value: '', label: 'All (not archived)' },
  { value: 'active', label: 'Active' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

function ProductsInner() {
  const shopId = useShopId();
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const base = shopBase(shopId);
  const { canManage } = useShopRole(shopId);

  const products = useCursorList<Product>(
    ['shop', shopId, 'products', status, search],
    PORTAL_ENDPOINTS.shop.products(shopId),
    { status, q: search, limit: 20 }
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    setSearch(q.trim());
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Keep stock accurate — tap −1 whenever you sell an item in the shop."
        actions={
          canManage ? (
            <>
              <Button variant="outline" size="sm" render={<Link href={`${base}/imports`} />}>
                Bulk import
              </Button>
              <Button size="sm" render={<Link href={`${base}/products/new`} />}>
                <Plus /> Add product
              </Button>
            </>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <form onSubmit={submit} className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name or SKU"
            className="pl-8"
            aria-label="Search products"
          />
        </form>
        <NativeSelect
          className="sm:w-48"
          aria-label="Filter by status"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {products.isPending ? (
        <LoadingBlock rows={5} />
      ) : products.isError ? (
        <EmptyState
          icon={Package}
          title="Could not load products"
          description={products.error?.message}
        />
      ) : !products.items.length ? (
        <EmptyState
          icon={Package}
          title={search || status ? 'No matching products' : 'No products yet'}
          description={
            search || status
              ? 'Try another search or filter.'
              : 'Add your first product or upload a CSV sheet.'
          }
          action={
            canManage ? (
              <Button size="sm" render={<Link href={`${base}/products/new`} />}>
                <Plus /> Add product
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {products.items.map(p => (
            <ProductRow key={p.id} shopId={shopId} product={p} canManage={canManage} />
          ))}
          <LoadMore
            hasMore={!!products.hasMore}
            loading={products.isLoadingMore}
            onLoad={products.loadMore}
            label="Show more products"
          />
        </div>
      )}
    </div>
  );
}

function ProductRow({
  shopId,
  product,
  canManage,
}: {
  shopId: number;
  product: Product;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const base = shopBase(shopId);
  const variants = product.variants.filter(v => v.isActive);
  const available = variants.reduce((s, v) => s + v.availableQty, 0);
  const image = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];

  const setStatus = useMutation({
    mutationFn: (status: 'active' | 'hidden' | 'archived') =>
      api(PORTAL_ENDPOINTS.shop.productStatus(shopId, product.id), {
        method: 'POST',
        body: { status },
      }),
    onSuccess: (_d, status) => {
      toast.success(
        status === 'active'
          ? 'Product is live'
          : status === 'hidden'
            ? 'Product hidden from customers'
            : 'Product archived'
      );
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });

  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg border">
          <Media
            src={image?.url}
            alt={product.nameEn}
            icon={product.category?.icon}
            seed={product.slug}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Link href={`${base}/products/${product.id}`} className="font-medium hover:underline">
                {product.nameEn}
              </Link>
            ) : (
              <span className="font-medium">{product.nameEn}</span>
            )}
            <StatusBadge status={product.status} />
            {product.isNegotiable ? (
              <span className="text-xs text-amber-700">Bargaining on</span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {product.category?.nameEn} · from {formatTaka(product.minPrice)} · {variants.length}{' '}
            variant{variants.length === 1 ? '' : 's'} ·{' '}
            <span className={cn(available === 0 && 'font-medium text-deal')}>
              {available} available
            </span>
          </p>
        </div>
        <div className={cn('hidden shrink-0 gap-1', canManage && 'sm:flex')}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit"
            render={<Link href={`${base}/products/${product.id}`} />}
          >
            <Pencil />
          </Button>
          {product.status === 'active' ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Hide"
              title="Hide from customers"
              onClick={() => setStatus.mutate('hidden')}
            >
              <EyeOff />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Activate"
              title="Make live"
              onClick={() => setStatus.mutate('active')}
            >
              <Eye />
            </Button>
          )}
          {product.status !== 'archived' ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Archive"
              title="Archive"
              onClick={() => setStatus.mutate('archived')}
            >
              <Archive />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {variants.map(v => (
          <StockRow key={v.id} shopId={shopId} variant={v} />
        ))}
      </div>
      <div className={cn('mt-2 gap-1 sm:hidden', canManage ? 'flex' : 'hidden')}>
        <Button
          variant="outline"
          size="xs"
          render={<Link href={`${base}/products/${product.id}`} />}
        >
          <Pencil /> Edit
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setStatus.mutate(product.status === 'active' ? 'hidden' : 'active')}
        >
          {product.status === 'active' ? 'Hide' : 'Activate'}
        </Button>
      </div>
    </div>
  );
}

function StockRow({ shopId, variant }: { shopId: number; variant: Variant }) {
  const qc = useQueryClient();
  const [count, setCount] = useState('');
  const update = useMutation({
    mutationFn: (body: { mode: 'set' | 'adjust'; quantity: number; reason?: string }) =>
      api<Variant>(PORTAL_ENDPOINTS.shop.variantStock(shopId, variant.id), {
        method: 'POST',
        body,
      }),
    onSuccess: v => {
      toast.success(`Stock now ${v.stockQty} (${v.availableQty} available)`);
      setCount('');
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });
  const low = variant.availableQty <= variant.lowStockThreshold;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-sm">
      <span className="min-w-24 flex-1 truncate">
        {variantText(variant.attributes) || 'Default'}
        {variant.sku ? (
          <span className="text-xs text-muted-foreground"> · {variant.sku}</span>
        ) : null}
      </span>
      <span className="tabular-nums">{formatTaka(variant.price)}</span>
      <span
        className={cn(
          'w-28 text-xs tabular-nums',
          low ? 'font-medium text-deal' : 'text-muted-foreground'
        )}
      >
        {variant.availableQty} avail · {variant.reservedQty} held
      </span>
      <span className="hidden text-xs text-muted-foreground lg:inline">
        updated {timeAgo(variant.stockUpdatedAt)}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Sold one in the shop"
          title="Sold 1 in the shop"
          disabled={update.isPending || variant.availableQty <= 0}
          onClick={() => update.mutate({ mode: 'adjust', quantity: -1, reason: 'offline_sale' })}
        >
          <Minus />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Restock one"
          title="Restock 1"
          disabled={update.isPending}
          onClick={() => update.mutate({ mode: 'adjust', quantity: 1, reason: 'restock' })}
        >
          <Plus />
        </Button>
        <form
          className="flex items-center gap-1"
          onSubmit={e => {
            e.preventDefault();
            const n = Number(count);
            if (count === '' || !Number.isInteger(n) || n < 0)
              return toast.error('Enter a whole number');
            update.mutate({ mode: 'set', quantity: n, reason: 'manual_adjust' });
          }}
        >
          <Input
            value={count}
            onChange={e => setCount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder={String(variant.stockQty)}
            aria-label="Set stock count"
            className="h-7 w-16"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={update.isPending || count === ''}
          >
            Set
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ShopProductsPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <ProductsInner />
    </Suspense>
  );
}
