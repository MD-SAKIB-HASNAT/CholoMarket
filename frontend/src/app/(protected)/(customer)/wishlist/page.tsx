'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/Bits';
import { ProductCard } from '@/components/shared/Cards';
import { LoadMore } from '@/components/shared/LoadMore';
import { LoadingBlock } from '@/components/dashboard/DashboardShell';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { ProductCard as ProductCardType } from '@/utils/types';

export default function WishlistPage() {
  const { user } = useRequireAuth();
  const items = useCursorList<ProductCardType>(
    ['wishlist'],
    STORE_ENDPOINTS.wishlist.list,
    { limit: 20 },
    { enabled: !!user }
  );
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Wishlist</h1>
      {items.isPending ? (
        <LoadingBlock />
      ) : !items.items.length ? (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Tap “Save for later” on any product to keep it here."
          action={<Button render={<Link href="/search" />}>Browse products</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items.items.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <LoadMore
            hasMore={!!items.hasMore}
            loading={items.isLoadingMore}
            onLoad={items.loadMore}
            auto
            label="Show more saved products"
          />
        </>
      )}
    </div>
  );
}
