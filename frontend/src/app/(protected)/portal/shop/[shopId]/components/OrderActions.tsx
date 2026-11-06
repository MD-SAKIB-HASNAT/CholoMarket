'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, PackageCheck, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/api/api';
import { formatTaka } from '@/utils/helpers/format';
import type { DeliveryAddress, ShopOrderStatus } from '@/utils/types';
import { SendWithSteadfast } from './Delivery';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

type Action = 'confirm' | 'ready' | 'complete' | 'reject';

interface Props {
  shopId: number;
  shopOrderId: number;
  subOrderNo: string;
  status: ShopOrderStatus;
  cashDue: number;
  /** Desk-pickup orders are handed over by the mall desk, not the shop counter. */
  deskPickup?: boolean;
  /** Home-delivery orders go out with the courier instead of being handed over. */
  delivery?: boolean;
  address?: DeliveryAddress | null;
  size?: 'sm' | 'default';
}

/**
 * Pickup: Confirm → Ready → Hand over (with the customer's pickup code).
 * Delivery: Confirm → Send with Steadfast. Either can be rejected before it leaves the shop.
 */
export function OrderActions({
  shopId,
  shopOrderId,
  subOrderNo,
  status,
  cashDue,
  deskPickup,
  delivery,
  address,
  size = 'sm',
}: Props) {
  const qc = useQueryClient();
  const [handover, setHandover] = useState(false);
  const [reject, setReject] = useState(false);
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');

  const act = useMutation({
    mutationFn: (body: { action: Action; pickupCode?: string; reason?: string }) =>
      api(PORTAL_ENDPOINTS.shop.orderAction(shopId, shopOrderId), { method: 'POST', body }),
    onSuccess: (_d, body) => {
      const msg: Record<Action, string> = {
        confirm: 'Order confirmed',
        ready: 'Marked ready — the customer has been notified',
        complete: 'Handed over. Sale recorded.',
        reject: 'Order rejected. Any online payment is refunded.',
      };
      toast.success(msg[body.action]);
      setHandover(false);
      setReject(false);
      setCode('');
      setReason('');
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
    onError: (e, body) => {
      toast.error(e.message);
      if (body.action === 'complete') setCode('');
    },
  });

  const busy = act.isPending;
  const canReject = status === 'placed' || status === 'confirmed';

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'placed' ? (
        <Button size={size} disabled={busy} onClick={() => act.mutate({ action: 'confirm' })}>
          <Check /> Confirm
        </Button>
      ) : null}
      {delivery && (status === 'placed' || status === 'confirmed') ? (
        <SendWithSteadfast
          shopId={shopId}
          shopOrderId={shopOrderId}
          subOrderNo={subOrderNo}
          cashDue={cashDue}
          address={address}
          size={size}
          primary={status === 'confirmed'}
        />
      ) : null}
      {!delivery && (status === 'placed' || status === 'confirmed') ? (
        <Button
          size={size}
          variant={status === 'placed' ? 'outline' : 'default'}
          disabled={busy}
          onClick={() => act.mutate({ action: 'ready' })}
        >
          <PackageCheck /> Mark ready
        </Button>
      ) : null}
      {(status === 'ready_for_pickup' || status === 'confirmed') && !deskPickup && !delivery ? (
        <Button
          size={size}
          variant={status === 'ready_for_pickup' ? 'default' : 'outline'}
          disabled={busy}
          onClick={() => setHandover(true)}
        >
          Hand over
        </Button>
      ) : null}
      {status === 'ready_for_pickup' && deskPickup ? (
        <span className="self-center text-xs text-muted-foreground">
          Send to the mall pickup desk — they hand it over.
        </span>
      ) : null}
      {canReject ? (
        <Button
          size={size}
          variant="ghost"
          className="text-destructive"
          disabled={busy}
          onClick={() => setReject(true)}
        >
          <X /> Reject
        </Button>
      ) : null}

      <Dialog open={handover} onOpenChange={setHandover}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hand over {subOrderNo}</DialogTitle>
            <DialogDescription>
              Ask the customer for the 6-digit pickup code shown in their app or SMS.
            </DialogDescription>
          </DialogHeader>
          {cashDue > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Collect <strong>{formatTaka(cashDue)}</strong> in cash before handing over.
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Fully paid online. Nothing to collect.
            </div>
          )}
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            autoFocus
            containerClassName="justify-center"
            disabled={busy}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} className="size-11 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandover(false)}>
              Cancel
            </Button>
            <Button
              disabled={code.length !== 6 || busy}
              onClick={() => act.mutate({ action: 'complete', pickupCode: code })}
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <Check />} Confirm handover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reject} onOpenChange={setReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {subOrderNo}?</DialogTitle>
            <DialogDescription>
              The items go back to stock and the customer is refunded. Tell them why.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. This size just sold out in the shop"
            aria-label="Reason"
            maxLength={300}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(false)}>
              Keep order
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || busy}
              onClick={() => act.mutate({ action: 'reject', reason: reason.trim() })}
            >
              Reject order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
