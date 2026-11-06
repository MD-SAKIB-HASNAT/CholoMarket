'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, X } from 'lucide-react';
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
import { StatusBadge } from '@/components/shared/Bits';
import { Field } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate, humanize } from '@/utils/helpers/format';
import type { Verification } from '@/app/(protected)/admin/utils/types';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export const KIND_LABEL: Record<Verification['kind'], string> = {
  trade_license: 'Trade licence',
  owner_nid: 'Owner NID',
  tin: 'TIN certificate',
  bin_vat: 'BIN / VAT',
  physical_visit: 'Physical visit',
};

/** Approve / reject a document with optional notes. */
export function ReviewDialog({
  verification,
  decision,
  onClose,
}: {
  verification: Verification;
  decision: 'approved' | 'rejected';
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const review = useMutation({
    mutationFn: () =>
      api(ADMIN_ENDPOINTS.verifications.review(verification.id), {
        method: 'POST',
        body: { status: decision, ...(notes.trim() && { notes: notes.trim() }) },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      qc.invalidateQueries({ queryKey: ['admin', 'shop'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success(decision === 'approved' ? 'Document approved' : 'Document rejected');
      onClose();
    },
  });
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {decision === 'approved' ? 'Approve' : 'Reject'}{' '}
            {KIND_LABEL[verification.kind].toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {verification.shop ? `${verification.shop.nameEn} · ` : ''}
            {verification.documentNumber ?? 'No number given'}
          </DialogDescription>
        </DialogHeader>
        <Field
          label={decision === 'rejected' ? 'Reason (shown to the shop)' : 'Notes (optional)'}
          htmlFor="rv-notes"
        >
          <Textarea id="rv-notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={decision === 'approved' ? 'default' : 'destructive'}
            onClick={() => review.mutate()}
            disabled={review.isPending || (decision === 'rejected' && !notes.trim())}
          >
            {decision === 'approved' ? <Check /> : <X />}{' '}
            {decision === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VerificationRow({
  v,
  canReview,
  onReview,
  showShop = false,
}: {
  v: Verification;
  canReview: boolean;
  onReview: (v: Verification, decision: 'approved' | 'rejected') => void;
  showShop?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{KIND_LABEL[v.kind]}</p>
          <StatusBadge status={v.status} />
        </div>
        {showShop && v.shop ? (
          <p className="text-sm">
            {v.shop.nameEn}
            {v.shop.market ? (
              <span className="text-muted-foreground"> · {v.shop.market.nameEn}</span>
            ) : null}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {v.documentNumber ? `No. ${v.documentNumber} · ` : ''}
          {v.expiresOn ? `Expires ${formatDate(v.expiresOn)} · ` : ''}
          Submitted {formatDate(v.createdAt)}
          {v.reviewedAt ? ` · Reviewed ${formatDate(v.reviewedAt)}` : ''}
        </p>
        {v.notes ? <p className="text-xs text-muted-foreground">“{v.notes}”</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {v.documentUrl ? (
          <Button
            variant="outline"
            size="sm"
            render={<a href={v.documentUrl} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink /> View document
          </Button>
        ) : null}
        {canReview && v.status === 'pending' ? (
          <>
            <Button size="sm" onClick={() => onReview(v, 'approved')}>
              <Check /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReview(v, 'rejected')}>
              <X /> Reject
            </Button>
          </>
        ) : null}
        {canReview && v.status === 'approved' && v.kind !== 'physical_visit' ? (
          <Button size="sm" variant="ghost" onClick={() => onReview(v, 'rejected')}>
            Revoke
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export const kindLabel = (k: string) => KIND_LABEL[k as Verification['kind']] ?? humanize(k);
