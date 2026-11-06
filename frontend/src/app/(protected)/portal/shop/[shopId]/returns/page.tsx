'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Undo2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { LoadMore } from '@/components/shared/LoadMore';
import { api } from '@/utils/api/api';
import { formatDate, formatTaka, humanize } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { OrderItem } from '@/utils/types';
import { useShopId, useShopRole } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

type Resolution = 'refund' | 'exchange' | 'store_credit' | 'repair';
type Action = 'approve' | 'reject' | 'receive' | 'resolve';

interface ReturnRequest {
  id: number;
  reason: string;
  details: string | null;
  photoUrls: string[];
  resolution: Resolution | null;
  status: string;
  shopNote: string | null;
  createdAt: string;
  shopOrder: { id: number; subOrderNo: string };
  customer: { id: number; fullName: string | null };
  items: { orderItemId: number; quantity: number; orderItem: OrderItem }[];
}

const NEXT: Record<string, { action: Action; label: string }[]> = {
  requested: [
    { action: 'approve', label: 'Approve' },
    { action: 'reject', label: 'Reject' },
  ],
  approved: [
    { action: 'receive', label: 'Item received' },
    { action: 'resolve', label: 'Resolve' },
    { action: 'reject', label: 'Reject' },
  ],
  item_received: [{ action: 'resolve', label: 'Resolve' }],
};

export default function ShopReturnsPage() {
  const shopId = useShopId();
  const { canManage } = useShopRole(shopId);
  const returns = useCursorList<ReturnRequest>(
    ['shop', shopId, 'returns'],
    PORTAL_ENDPOINTS.shop.returns(shopId),
    { limit: 20 }
  );

  return (
    <div>
      <PageHeader
        title="Returns"
        description="Resolving a refund puts the item back in stock and deducts it from your balance."
      />
      {returns.isPending ? (
        <LoadingBlock />
      ) : returns.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Could not load returns"
          description={returns.error?.message}
        />
      ) : !returns.items.length ? (
        <EmptyState
          icon={Undo2}
          title="No return requests"
          description="Clear size charts and honest photos keep it that way."
        />
      ) : (
        <div className="grid gap-3">
          {returns.items.map(r => (
            <ReturnCard key={r.id} shopId={shopId} request={r} canRespond={canManage} />
          ))}
          <LoadMore
            hasMore={!!returns.hasMore}
            loading={returns.isLoadingMore}
            onLoad={returns.loadMore}
            label="Show more returns"
          />
        </div>
      )}
    </div>
  );
}

function ReturnCard({
  shopId,
  request: r,
  canRespond,
}: {
  shopId: number;
  request: ReturnRequest;
  canRespond: boolean;
}) {
  const qc = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);
  const [resolution, setResolution] = useState<Resolution>(r.resolution ?? 'refund');
  const [note, setNote] = useState('');
  const amount = r.items.reduce((s, i) => s + i.orderItem.unitPrice * i.quantity, 0);

  const respond = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.shop.returnRespond(shopId, r.id), {
        method: 'POST',
        body: {
          action,
          ...(action === 'approve' || action === 'resolve' ? { resolution } : {}),
          ...(note.trim() && { note: note.trim() }),
        },
      }),
    onSuccess: () => {
      toast.success('Return updated');
      setAction(null);
      setNote('');
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            Return #{r.id} · {r.shopOrder.subOrderNo}
          </p>
          <p className="text-xs text-muted-foreground">
            {r.customer.fullName ?? 'Customer'} · {formatDate(r.createdAt, true)}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <p className="mt-2 text-sm">
        <span className="font-medium">{humanize(r.reason)}</span>
        {r.details ? <span className="text-muted-foreground"> — {r.details}</span> : null}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {r.items.map(i => (
          <li key={i.orderItemId} className="flex justify-between gap-2">
            <span>
              {i.quantity} × {i.orderItem.productName}
              {i.orderItem.variantLabel ? (
                <span className="text-muted-foreground"> · {i.orderItem.variantLabel}</span>
              ) : null}
            </span>
            <span className="tabular-nums">{formatTaka(i.orderItem.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>
      {r.resolution ? (
        <p className="mt-2 text-xs text-muted-foreground">Resolution: {humanize(r.resolution)}</p>
      ) : null}
      {r.shopNote ? (
        <p className="mt-1 text-xs text-muted-foreground">Your note: {r.shopNote}</p>
      ) : null}
      {NEXT[r.status] && canRespond ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {NEXT[r.status].map(n => (
            <Button
              key={n.action}
              size="sm"
              variant={
                n.action === 'reject'
                  ? 'ghost'
                  : n.action === 'resolve' || n.action === 'approve'
                    ? 'default'
                    : 'outline'
              }
              className={n.action === 'reject' ? 'text-destructive' : undefined}
              onClick={() => setAction(n.action)}
            >
              {n.label}
            </Button>
          ))}
        </div>
      ) : null}

      <Dialog open={!!action} onOpenChange={o => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action ? humanize(action) : ''} return #{r.id}
            </DialogTitle>
            <DialogDescription>
              {action === 'resolve' && resolution === 'refund'
                ? `Refunds ${formatTaka(amount)} to the customer and restocks the items.`
                : 'The customer is notified of your decision.'}
            </DialogDescription>
          </DialogHeader>
          {action === 'approve' || action === 'resolve' ? (
            <Field label="Resolution" htmlFor={`res-${r.id}`}>
              <NativeSelect
                id={`res-${r.id}`}
                value={resolution}
                onChange={e => setResolution(e.target.value as Resolution)}
              >
                <option value="refund">Refund</option>
                <option value="exchange">Exchange</option>
                <option value="store_credit">Store credit</option>
                <option value="repair">Repair</option>
              </NativeSelect>
            </Field>
          ) : null}
          <Field label="Note to customer (optional)" htmlFor={`note-${r.id}`}>
            <Textarea
              id={`note-${r.id}`}
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={500}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              variant={action === 'reject' ? 'destructive' : 'default'}
              disabled={respond.isPending}
              onClick={() => respond.mutate()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
