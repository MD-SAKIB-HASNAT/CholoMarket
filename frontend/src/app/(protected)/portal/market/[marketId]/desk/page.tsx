'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Banknote,
  Check,
  Clock,
  Inbox,
  LoaderCircle,
  Phone,
  Store,
} from 'lucide-react';
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { api } from '@/utils/api/api';
import { formatPhone, formatTaka, timeAgo, timeLeft } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { ShopOrder } from '@/utils/types';
import { useMarketId } from '@/app/(protected)/portal/market/[marketId]/hooks/usemarket';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export default function PickupDeskPage() {
  const marketId = useMarketId();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [handover, setHandover] = useState<ShopOrder | null>(null);
  const desk = useCursorList<ShopOrder>(
    ['market', marketId, 'desk', tab],
    PORTAL_ENDPOINTS.market.deskOrders(marketId),
    { status: tab, limit: 50 },
    { refetchInterval: 15_000 }
  );

  const ready = desk.items.filter(s => s.status === 'ready_for_pickup');
  const waiting = desk.items.filter(s => s.status !== 'ready_for_pickup');

  return (
    <div>
      <PageHeader
        title="Pickup desk"
        description="Customers show their 6-digit code. Check it, collect any cash due, and hand over."
      />
      <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">To hand over</TabsTrigger>
          <TabsTrigger value="completed">Handed over</TabsTrigger>
        </TabsList>
      </Tabs>

      {desk.isPending ? (
        <LoadingBlock />
      ) : desk.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Could not load desk orders"
          description={desk.error?.message}
        />
      ) : !desk.items.length ? (
        <EmptyState
          icon={Inbox}
          title={tab === 'active' ? 'No parcels waiting' : 'Nothing handed over yet'}
        />
      ) : tab === 'completed' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {desk.items.map(so => (
            <DeskCard key={so.id} so={so} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-emerald-700">Ready — {ready.length}</h2>
            {ready.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ready.map(so => (
                  <DeskCard key={so.id} so={so} onHandover={() => setHandover(so)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing ready yet.</p>
            )}
          </section>
          {waiting.length ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                Waiting for shop — {waiting.length}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {waiting.map(so => (
                  <DeskCard key={so.id} so={so} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
      <LoadMore
        hasMore={!!desk.hasMore}
        loading={desk.isLoadingMore}
        onLoad={desk.loadMore}
        label="Show more parcels"
      />
      <HandoverDialog marketId={marketId} so={handover} onClose={() => setHandover(null)} />
    </div>
  );
}

function DeskCard({ so, onHandover }: { so: ShopOrder; onHandover?: () => void }) {
  const items = so.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="flex flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold tracking-tight">{so.subOrderNo}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Store className="size-4" /> {so.shop?.nameEn}
            {so.shop?.shopNumber ? ` · ${so.shop.shopNumber}` : ''}
          </p>
        </div>
        <StatusBadge status={so.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p className="font-medium">{so.order?.contactName}</p>
        {so.order?.contactPhone ? (
          <a
            href={`tel:${so.order.contactPhone}`}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Phone className="size-4" /> {formatPhone(so.order.contactPhone)}
          </a>
        ) : null}
        <p className="text-muted-foreground">
          {items} item{items === 1 ? '' : 's'}: {so.items.map(i => i.productName).join(', ')}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {so.cashDue > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
            <Banknote className="size-4" /> Collect {formatTaka(so.cashDue)}
          </span>
        ) : (
          <span className="font-medium text-emerald-700">Paid</span>
        )}
        {so.status !== 'completed' && so.reservedUntil ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> {timeLeft(so.reservedUntil)}
          </span>
        ) : so.completedAt ? (
          <span className="text-xs text-muted-foreground">{timeAgo(so.completedAt)}</span>
        ) : null}
      </div>
      {onHandover ? (
        <Button size="lg" className="mt-4 h-11 text-base" onClick={onHandover}>
          Hand over
        </Button>
      ) : so.status !== 'completed' ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
          Waiting for the shop to send it
        </p>
      ) : null}
    </div>
  );
}

function HandoverDialog({
  marketId,
  so,
  onClose,
}: {
  marketId: number;
  so: ShopOrder | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const complete = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.market.deskOrderComplete(marketId, so!.id), {
        method: 'POST',
        body: { pickupCode: code },
      }),
    onSuccess: () => {
      toast.success(`${so?.subOrderNo} handed over`);
      setCode('');
      onClose();
      qc.invalidateQueries({ queryKey: ['market', marketId] });
    },
    onError: e => {
      toast.error(e.message);
      setCode('');
    },
  });

  return (
    <Dialog
      open={!!so}
      onOpenChange={o => {
        if (!o) {
          setCode('');
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hand over {so?.subOrderNo}</DialogTitle>
          <DialogDescription>Type the customer’s 6-digit pickup code.</DialogDescription>
        </DialogHeader>
        {so && so.cashDue > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Collect <strong>{formatTaka(so.cashDue)}</strong> in cash first.
          </div>
        ) : null}
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          autoFocus
          containerClassName="justify-center"
          disabled={complete.isPending}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-12 text-xl" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={code.length !== 6 || complete.isPending}
            onClick={() => complete.mutate()}
          >
            {complete.isPending ? <LoaderCircle className="animate-spin" /> : <Check />} Confirm
            handover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
