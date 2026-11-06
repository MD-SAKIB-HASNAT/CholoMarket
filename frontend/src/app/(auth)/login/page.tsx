'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, KeyRound, LoaderCircle, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/site/Logo';
import { Media } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { useAuth } from '@/utils/context/AuthContext';
import { panelHomeFor } from '@/utils/helpers/panel';
import type { Me } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

const DEMO = [
  { label: 'Customer', phone: '01800000001' },
  { label: 'Shop owner', phone: '01711000002' },
  { label: 'Mall admin', phone: '01700000010' },
  { label: 'Pickup desk', phone: '01700000011' },
  { label: 'Super admin', phone: '01700000001' },
];

function landingFor(user: Me, next: string | null) {
  // Admin, shop and mall accounts live in their panel; only panel links are honoured for them.
  const panel = panelHomeFor(user);
  if (panel)
    return next && (next.startsWith('/admin') || next.startsWith('/portal')) ? next : panel;
  if (next && next.startsWith('/')) return next;
  return '/';
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const { login, user } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (user && step === 'phone') router.replace(landingFor(user, next));
  }, [user, step, router, next]);

  const request = useMutation({
    mutationFn: (p: string) =>
      api<{ phone: string; devCode?: string }>(STORE_ENDPOINTS.auth.otpRequest, {
        method: 'POST',
        body: { phone: p },
        token: null,
      }),
    onSuccess: res => {
      setDevCode(res.devCode ?? null);
      setStep('code');
      toast.success('Code sent by SMS');
    },
    onError: e => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: () =>
      api<{ accessToken: string; user: Me }>(STORE_ENDPOINTS.auth.otpVerify, {
        method: 'POST',
        body: { phone, code, ...(name.trim() && { fullName: name.trim() }) },
        token: null,
      }),
    onSuccess: res => {
      login(res.accessToken, res.user);
      toast.success(`Welcome${res.user.fullName ? `, ${res.user.fullName.split(' ')[0]}` : ''}!`);
      router.replace(landingFor(res.user, next));
    },
    onError: e => {
      setCode('');
      toast.error(e.message);
    },
  });

  useEffect(() => {
    if (code.length === 6 && !verify.isPending) verify.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function sendCode(e?: FormEvent) {
    e?.preventDefault();
    request.mutate(phone);
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-6 sm:p-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">
          {step === 'phone' ? (
            <form onSubmit={sendCode} className="grid gap-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Log in or sign up</h1>
                <p className="text-sm text-muted-foreground">
                  We’ll text a 6-digit code to your mobile. No password needed.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Mobile number</Label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    className="h-10 pl-9"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="name">
                  Your name{' '}
                  <span className="font-normal text-muted-foreground">(new customers)</span>
                </Label>
                <Input
                  id="name"
                  className="h-10"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-10"
                disabled={request.isPending || phone.length < 11}
              >
                {request.isPending ? <LoaderCircle className="animate-spin" /> : <KeyRound />} Send
                code
              </Button>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Demo accounts (click to fill)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO.map(d => (
                    <Button
                      key={d.phone}
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setPhone(d.phone)}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <div className="grid gap-5">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Change number
              </button>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Enter the code</h1>
                <p className="text-sm text-muted-foreground">
                  Sent to {phone}. It expires in 5 minutes.
                </p>
              </div>
              {devCode ? (
                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Development mode — your code is{' '}
                  <span className="font-mono font-semibold tracking-widest">{devCode}</span>
                </div>
              ) : null}
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                autoFocus
                disabled={verify.isPending}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="size-11 text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button
                size="lg"
                className="h-10"
                onClick={() => verify.mutate()}
                disabled={code.length !== 6 || verify.isPending}
              >
                {verify.isPending ? <LoaderCircle className="animate-spin" /> : null} Verify &
                continue
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sendCode()}
                disabled={request.isPending}
              >
                Resend code
              </Button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            Continue browsing without logging in
          </Link>
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Media
          src="https://images.unsplash.com/photo-1783309529305-603762ff3cca?auto=format&fit=crop&w=1400&q=80"
          alt="Shoppers walking past textile stalls in a market"
          width={1400}
          priority
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="relative flex h-full flex-col justify-end gap-3 p-12 text-white">
          <p lang="bn" className="text-4xl leading-tight font-semibold">
            ঘরে বসেই পুরো মার্কেট ঘুরে দেখুন
          </p>
          <p className="max-w-md text-lg text-white/85">
            Walk through Dhaka’s malls shop by shop, order what you like, and get it delivered to
            your door or pick it up yourself.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
