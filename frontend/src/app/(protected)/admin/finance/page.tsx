'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HandCoins, Lock, Send, Wallet } from 'lucide-react';
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
import { PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge, VerifiedBadge } from '@/components/shared/Bits';
import { Field } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate, formatTaka, timeAgo } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import type { Balance, Payout } from '@/app/(protected)/admin/utils/types';
import { useAllRows } from '@/app/(protected)/admin/utils/hooks';
import { EmptyRow, ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function FinancePage() {
  const { can } = useAdminRole();
  const [paying, setPaying] = useState<Balance | null>(null);
  const allowed = can('financeView');
  // The headline numbers add up every shop, so balances are loaded in full; payouts are a feed with "Show more".
  const balances = useAllRows<Balance>(
    ['admin', 'balances'],
    ADMIN_ENDPOINTS.finance.balances,
    {},
    allowed
  );
  const payouts = useCursorList<Payout>(
    ['admin', 'payouts'],
    ADMIN_ENDPOINTS.finance.payouts,
    { limit: 15 },
    { enabled: allowed }
  );

  if (!allowed) {
    return (
      <>
        <PageHeader title="Finance" />
        <EmptyState
          icon={Lock}
          title="Finance team only"
          description="Shop balances and payouts are visible to finance staff and super admins."
        />
      </>
    );
  }

  const owed = (balances.data ?? []).filter(b => b.balance > 0).reduce((s, b) => s + b.balance, 0);
  const negative = (balances.data ?? []).filter(b => b.balance < 0);

  return (
    <>
      <PageHeader
        title="Finance"
        description="What the platform owes each shop: online payments collected for them, minus commission, refunds and payouts already sent."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Owed to shops"
          value={formatTaka(owed)}
          icon={Wallet}
          hint="Sum of positive balances"
        />
        <StatCard
          label="Shops owing commission"
          value={negative.length}
          icon={HandCoins}
          tone={negative.length ? 'warning' : 'default'}
          hint={
            negative.length
              ? `${formatTaka(-negative.reduce((s, b) => s + b.balance, 0))} on cash sales`
              : 'Nothing outstanding'
          }
        />
        <StatCard
          label="Payouts sent"
          value={payouts.isPending ? '—' : `${payouts.items.length}${payouts.hasMore ? '+' : ''}`}
          icon={Send}
        />
      </div>
      <div className="grid gap-6">
        <Panel title="Shop balances">
          <QueryState
            isLoading={balances.isLoading}
            error={balances.error}
            emptyIcon={Wallet}
            emptyTitle="No shops"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Payout account</TableHead>
                  <TableHead>Last entry</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  {can('payouts') ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.data?.length ? (
                  balances.data.map(b => (
                    <TableRow key={b.shopId}>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-medium">
                          {b.shopName}{' '}
                          {b.isVerified ? <VerifiedBadge className="size-3.5" /> : null}
                        </span>
                      </TableCell>
                      <TableCell>{b.marketName ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {b.payoutAccount ?? (
                          <span className="font-sans text-amber-700">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.lastEntryAt ? timeAgo(b.lastEntryAt) : '—'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${b.balance < 0 ? 'text-destructive' : ''}`}
                      >
                        {formatTaka(b.balance)}
                      </TableCell>
                      {can('payouts') ? (
                        <TableCell className="text-right">
                          <Button size="xs" disabled={b.balance <= 0} onClick={() => setPaying(b)}>
                            <Send /> Pay out
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow colSpan={6}>No balances yet.</EmptyRow>
                )}
              </TableBody>
            </Table>
          </QueryState>
        </Panel>
        <Panel title="Recent payouts">
          <QueryState
            isLoading={payouts.isPending}
            error={payouts.error}
            emptyIcon={Send}
            emptyTitle="No payouts"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.items.length ? (
                  payouts.items.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(p.paidAt ?? p.createdAt, true)}
                      </TableCell>
                      <TableCell>{p.shop?.nameEn ?? `#${p.shopId}`}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.reference ?? '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTaka(p.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow colSpan={6}>No payouts sent yet.</EmptyRow>
                )}
              </TableBody>
            </Table>
            <ListFoot
              shown={payouts.items.length}
              noun="payout"
              hasMore={!!payouts.hasMore}
              loading={payouts.isLoadingMore}
              onLoad={payouts.loadMore}
            />
          </QueryState>
        </Panel>
      </div>
      {paying ? <PayoutDialog balance={paying} onClose={() => setPaying(null)} /> : null}
    </>
  );
}

function PayoutDialog({ balance, onClose }: { balance: Balance; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(String(balance.balance));
  const [reference, setReference] = useState('');
  const pay = useMutation({
    mutationFn: () =>
      api<Payout>(ADMIN_ENDPOINTS.finance.payouts, {
        method: 'POST',
        body: {
          shopId: balance.shopId,
          amount: Number(amount),
          ...(reference.trim() && { reference: reference.trim() }),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'balances'] });
      qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      toast.success(`${formatTaka(Number(amount))} paid to ${balance.shopName}`);
      onClose();
    },
  });
  const n = Number(amount);
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay out to {balance.shopName}</DialogTitle>
          <DialogDescription>
            Send the money first (bKash / bank), then record it here with the transaction reference.
            Balance: {formatTaka(balance.balance)}.
            {balance.payoutAccount
              ? ` Account: ${balance.payoutAccount}.`
              : ' No payout account on file.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Amount (৳)" htmlFor="po-amount">
            <Input
              id="po-amount"
              type="number"
              min={1}
              max={balance.balance}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </Field>
          <Field
            label="Transaction reference"
            htmlFor="po-ref"
            hint="bKash TrxID or bank reference"
          >
            <Input id="po-ref" value={reference} onChange={e => setReference(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => pay.mutate()}
            disabled={pay.isPending || !(n > 0) || n > balance.balance}
          >
            <Send /> Record payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
