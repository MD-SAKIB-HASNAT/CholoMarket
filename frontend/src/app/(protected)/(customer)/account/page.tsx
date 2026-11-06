'use client';

import { useMutation } from '@tanstack/react-query';
import { Handshake, Heart, MessageCircle, Package, Store } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShopCard } from '@/components/shared/Cards';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { LoadMore } from '@/components/shared/LoadMore';
import { LoadingBlock } from '@/components/dashboard/DashboardShell';
import { api } from '@/utils/api/api';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { formatDate, formatPhone } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Me, Shop } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

const LINKS = [
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/offers', label: 'Offers', icon: Handshake },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
];

export default function AccountPage() {
  const { user, refresh } = useRequireAuth();
  // null = not edited yet, show the saved value.
  const [nameInput, setFullName] = useState<string | null>(null);
  const [emailInput, setEmail] = useState<string | null>(null);
  const [langInput, setLang] = useState<'bn' | 'en' | null>(null);
  const fullName = nameInput ?? user?.fullName ?? '';
  const email = emailInput ?? user?.email ?? '';
  const lang = langInput ?? user?.preferredLanguage ?? 'bn';

  const following = useCursorList<Shop>(
    ['following'],
    STORE_ENDPOINTS.shops.following,
    { limit: 12 },
    { enabled: !!user }
  );
  const save = useMutation({
    mutationFn: () =>
      api<Me>(STORE_ENDPOINTS.auth.me, {
        method: 'PATCH',
        body: { fullName, ...(email && { email }), preferredLanguage: lang },
      }),
    onSuccess: () => {
      toast.success('Profile saved');
      void refresh();
    },
  });

  if (!user)
    return (
      <div className="container-page py-8">
        <LoadingBlock />
      </div>
    );

  return (
    <div className="container-page max-w-4xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My account</h1>
        <p className="text-sm text-muted-foreground">
          {formatPhone(user.phone)} · member since {formatDate(user.createdAt)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-sm hover:shadow-sm"
          >
            <l.icon className="size-5 text-primary" /> {l.label}
          </Link>
        ))}
      </div>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Profile</h2>
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={e => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Name" htmlFor="fullName">
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
          </Field>
          <Field label="Email (optional)" htmlFor="email">
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Language" htmlFor="lang">
            <NativeSelect
              id="lang"
              value={lang}
              onChange={e => setLang(e.target.value as 'bn' | 'en')}
            >
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </NativeSelect>
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={save.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </section>
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Store className="size-4" /> Shops you follow
        </h2>
        {following.items.length ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {following.items.map(s => (
                <ShopCard key={s.id} shop={s} />
              ))}
            </div>
            <LoadMore
              hasMore={!!following.hasMore}
              loading={following.isLoadingMore}
              onLoad={following.loadMore}
              label="Show more shops"
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Follow shops to hear about new stock and offers.
          </p>
        )}
      </section>
    </div>
  );
}
