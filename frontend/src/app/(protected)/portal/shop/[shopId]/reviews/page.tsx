'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { api } from '@/utils/api/api';
import { formatDate } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Review } from '@/utils/types';
import { useShopId, useShopRole } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export default function ShopReviewsPage() {
  const shopId = useShopId();
  const { canManage } = useShopRole(shopId);
  const reviews = useCursorList<Review>(
    ['shop', shopId, 'reviews'],
    PORTAL_ENDPOINTS.shop.reviews(shopId),
    { limit: 20 }
  );

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="A polite public reply builds trust with the next customer."
      />
      {reviews.isPending ? (
        <LoadingBlock />
      ) : reviews.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Could not load reviews"
          description={reviews.error?.message}
        />
      ) : !reviews.items.length ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Customers can review after they collect an order."
        />
      ) : (
        <div className="grid gap-3">
          {reviews.items.map(r => (
            <ReviewCard key={r.id} shopId={shopId} review={r} canReply={canManage} />
          ))}
          <LoadMore
            hasMore={!!reviews.hasMore}
            loading={reviews.isLoadingMore}
            onLoad={reviews.loadMore}
            label="Show more reviews"
          />
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  shopId,
  review,
  canReply,
}: {
  shopId: number;
  review: Review;
  canReply: boolean;
}) {
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [editing, setEditing] = useState(false);
  const save = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.shop.reviewReply(shopId, review.id), {
        method: 'POST',
        body: { reply: reply.trim() },
      }),
    onSuccess: () => {
      toast.success('Reply posted');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'reviews'] });
    },
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={
                i < review.rating
                  ? 'size-4 fill-amber-400 text-amber-400'
                  : 'size-4 text-muted-foreground/40'
              }
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {review.author} · {formatDate(review.createdAt)}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {review.productName ? `Product: ${review.productName}` : 'Shop review'}
      </p>
      {review.comment ? <p className="mt-2 text-sm">{review.comment}</p> : null}
      {review.shopReply && !editing ? (
        <div className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Your reply</p>
          {review.shopReply}
          {canReply ? (
            <Button
              variant="link"
              size="xs"
              className="ml-1"
              onClick={() => {
                setReply(review.shopReply ?? '');
                setEditing(true);
              }}
            >
              Edit
            </Button>
          ) : null}
        </div>
      ) : canReply ? (
        <form
          className="mt-3 grid gap-2"
          onSubmit={e => {
            e.preventDefault();
            if (reply.trim()) save.mutate();
          }}
        >
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Thank the customer or address their concern…"
            aria-label="Reply"
            maxLength={1000}
            rows={2}
          />
          <div>
            <Button type="submit" size="sm" disabled={!reply.trim() || save.isPending}>
              Post reply
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
