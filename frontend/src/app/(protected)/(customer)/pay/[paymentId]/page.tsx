'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CircleCheck, LoaderCircle, Lock, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/utils/api/api';
import { useAuth, useRequireAuth } from '@/utils/context/AuthContext';
import { formatTaka } from '@/utils/helpers/format';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

interface PaymentView {
  id: number;
  method: 'bkash' | 'nagad';
  purpose: 'full' | 'deposit' | 'balance';
  amount: number;
  status: string;
  order: { orderNo: string; grandTotal: number; status: string };
}

const BRAND = {
  bkash: { name: 'bKash', bg: 'bg-[#e2136e]', text: 'text-[#e2136e]' },
  nagad: { name: 'Nagad', bg: 'bg-[#f6921e]', text: 'text-[#f6921e]' },
};

/**
 * Development stand-in for the bKash / Nagad hosted checkout.
 * In production the backend redirects to the real gateway and this page is not used.
 */
export default function PayPage() {
  useRequireAuth();
  const { user } = useAuth();
  const { paymentId } = useParams<{ paymentId: string }>();
  const router = useRouter();
  const [wallet, setWallet] = useState('');
  const [pin, setPin] = useState('');

  const payment = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => api<PaymentView>(STORE_ENDPOINTS.payments.byId(paymentId)),
    enabled: !!user,
  });

  const complete = useMutation({
    mutationFn: (success: boolean) =>
      api<{ status: string; trxId: string | null }>(
        STORE_ENDPOINTS.payments.mockComplete(paymentId),
        {
          method: 'POST',
          body: { success, ...(wallet && { walletNumber: wallet }) },
        }
      ),
    onSuccess: res => {
      const orderNo = payment.data!.order.orderNo;
      if (res.status === 'succeeded') {
        toast.success(`Payment received · TrxID ${res.trxId}`);
        router.replace(`/orders/${orderNo}?placed=1`);
      } else {
        toast.error('Payment cancelled. Your order is kept for a few minutes — you can try again.');
        router.replace(`/orders/${orderNo}`);
      }
    },
  });

  if (!payment.data) {
    return (
      <div className="container-page max-w-md py-12">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const p = payment.data;
  const brand = BRAND[p.method] ?? BRAND.bkash;

  if (p.status === 'succeeded') {
    return (
      <div className="container-page max-w-md py-12 text-center">
        <CircleCheck className="mx-auto size-12 text-emerald-600" />
        <p className="mt-3 font-medium">This payment is already complete.</p>
        <Button className="mt-4" render={<Link href={`/orders/${p.order.orderNo}`} />}>
          View order
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-md py-10">
      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <div className={cn('flex items-center justify-between px-5 py-4 text-white', brand.bg)}>
          <span className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="size-5" /> {brand.name}
          </span>
          <span className="text-xs opacity-90">Sandbox</span>
        </div>
        <div className="space-y-5 bg-card p-5">
          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant</span>
              <span className="font-medium">Cholo Market</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono">{p.order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {p.purpose === 'deposit' ? 'Deposit' : 'Amount'}
              </span>
              <span className={cn('text-lg font-semibold', brand.text)}>
                {formatTaka(p.amount)}
              </span>
            </div>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="wallet" className="text-sm font-medium">
              Your {brand.name} account number
            </label>
            <Input
              id="wallet"
              inputMode="tel"
              placeholder="01XXXXXXXXX"
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="pin" className="text-sm font-medium">
              PIN
            </label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={5}
              placeholder="•••••"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Sandbox: any 11-digit number and any PIN will work.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => complete.mutate(false)}
              disabled={complete.isPending}
            >
              Cancel
            </Button>
            <Button
              className={cn('text-white', brand.bg)}
              onClick={() => complete.mutate(true)}
              disabled={complete.isPending || wallet.length < 11 || !pin}
            >
              {complete.isPending ? <LoaderCircle className="animate-spin" /> : <Lock />} Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
