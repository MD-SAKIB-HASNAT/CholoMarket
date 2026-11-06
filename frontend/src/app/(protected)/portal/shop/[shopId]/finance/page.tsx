'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Landmark, Plus, Wallet } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingBlock, PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate, formatTaka, humanize } from '@/utils/helpers/format';
import { cn } from '@/utils/helpers/cn';
import { useShopId, useShopRole } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { ManagerOnly } from '@/app/(protected)/portal/shop/[shopId]/components/ManagerOnly';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

interface Finance {
  balance: number;
  entries: {
    id: number;
    kind: string;
    amount: number;
    description: string | null;
    createdAt: string;
    shopOrder: { id: number; subOrderNo: string } | null;
  }[];
  payouts: {
    id: number;
    amount: number;
    status: string;
    reference: string | null;
    periodStart: string;
    periodEnd: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  accounts: {
    id: number;
    method: 'bkash' | 'nagad' | 'bank';
    accountName: string;
    accountNumber: string;
    bankName: string | null;
    branchName: string | null;
    isDefault: boolean;
    verifiedAt: string | null;
  }[];
}

function ShopFinancePage() {
  const shopId = useShopId();
  const [open, setOpen] = useState(false);
  const { isOwner } = useShopRole(shopId);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['shop', shopId, 'finance'],
    queryFn: () => api<Finance>(PORTAL_ENDPOINTS.shop.finance(shopId)),
  });

  if (isLoading) return <LoadingBlock rows={6} />;
  if (isError || !data)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Could not load finance"
        description={error?.message}
      />
    );

  const sales = data.entries
    .filter(e => e.kind === 'sale' || e.kind === 'adjustment')
    .reduce((s, e) => s + e.amount, 0);
  const commission = -data.entries
    .filter(e => e.kind === 'commission')
    .reduce((s, e) => s + e.amount, 0);
  const paid = data.payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Online payments are held by the platform and paid out to you. Cash you collect stays with you; only commission is deducted."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Balance owed to you"
          value={formatTaka(data.balance)}
          icon={Wallet}
          tone={data.balance < 0 ? 'warning' : 'success'}
          hint={data.balance < 0 ? 'Negative: commission on cash sales is due' : undefined}
        />
        <StatCard label="Online sales (recent)" value={formatTaka(sales)} />
        <StatCard label="Commission (recent)" value={formatTaka(commission)} />
        <StatCard label="Paid out" value={formatTaka(paid)} />
      </div>

      <Panel title="Ledger">
        {data.entries.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden md:table-cell">Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(e.createdAt)}</TableCell>
                    <TableCell>{humanize(e.kind)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {e.shopOrder?.subOrderNo ?? '—'}
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                      {e.description}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-medium tabular-nums',
                        e.amount < 0 ? 'text-deal' : 'text-emerald-700'
                      )}
                    >
                      {e.amount > 0 ? '+' : ''}
                      {formatTaka(e.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payouts">
          {data.payouts.length ? (
            <ul className="divide-y">
              {data.payouts.map(p => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium tabular-nums">{formatTaka(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.paidAt ?? p.createdAt)}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No payouts yet.</p>
          )}
        </Panel>
        <Panel
          title="Payout accounts"
          action={
            isOwner ? (
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Plus /> Add
              </Button>
            ) : null
          }
        >
          {data.accounts.length ? (
            <ul className="divide-y">
              {data.accounts.map(a => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <Landmark className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {a.method === 'bank' ? (a.bankName ?? 'Bank') : humanize(a.method)}{' '}
                      {a.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.accountName}
                      {a.branchName ? ` · ${a.branchName}` : ''}
                    </p>
                  </div>
                  {a.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {isOwner
                ? 'Add a bKash, Nagad or bank account to receive payouts.'
                : 'No payout account yet. The shop owner adds it.'}
            </p>
          )}
        </Panel>
      </div>
      <AddAccountDialog shopId={shopId} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function AddAccountDialog({
  shopId,
  open,
  onOpenChange,
}: {
  shopId: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const save = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.shop.payoutAccounts(shopId), {
        method: 'POST',
        body: {
          method,
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          ...(method === 'bank' && {
            bankName: bankName.trim() || undefined,
            branchName: branchName.trim() || undefined,
            routingNumber: routingNumber.trim() || undefined,
          }),
          isDefault,
        },
      }),
    onSuccess: () => {
      toast.success('Payout account added');
      onOpenChange(false);
      setAccountName('');
      setAccountNumber('');
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'finance'] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add payout account</DialogTitle>
          </DialogHeader>
          <Field label="Method" htmlFor="method">
            <NativeSelect
              id="method"
              value={method}
              onChange={e => setMethod(e.target.value as typeof method)}
            >
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="bank">Bank account</option>
            </NativeSelect>
          </Field>
          <Field label="Account name" htmlFor="accountName">
            <Input
              id="accountName"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              required
              maxLength={80}
            />
          </Field>
          <Field
            label={method === 'bank' ? 'Account number' : 'Wallet number'}
            htmlFor="accountNumber"
          >
            <Input
              id="accountNumber"
              inputMode="numeric"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              required
              maxLength={40}
            />
          </Field>
          {method === 'bank' ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Bank" htmlFor="bank">
                <Input id="bank" value={bankName} onChange={e => setBankName(e.target.value)} />
              </Field>
              <Field label="Branch" htmlFor="branch">
                <Input
                  id="branch"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                />
              </Field>
              <Field label="Routing no." htmlFor="routing">
                <Input
                  id="routing"
                  value={routingNumber}
                  onChange={e => setRoutingNumber(e.target.value)}
                />
              </Field>
            </div>
          ) : null}
          <label className="flex items-center justify-between gap-3 text-sm">
            Use as default for payouts
            <Switch checked={isDefault} onCheckedChange={v => setIsDefault(v)} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              Save account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ShopFinancePagePage() {
  return (
    <ManagerOnly>
      <ShopFinancePage />
    </ManagerOnly>
  );
}
