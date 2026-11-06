'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Menu,
  Package,
  Phone,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/utils/api/api';
import { useAuth } from '@/utils/context/AuthContext';
import type { Cart } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { Logo } from '@/components/site/Logo';
import { NotificationBell } from '@/components/site/NotificationBell';
import { UserMenu } from '@/components/site/UserMenu';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => api<Cart>(STORE_ENDPOINTS.cart.root),
    enabled: !!user,
  });
}

/** The whole site is organised as mall → shop → product. */
export const JOURNEY = [
  {
    step: 1,
    href: '/markets',
    label: 'Malls & markets',
    short: 'Malls',
    icon: Building2,
    scope: 'market',
  },
  { step: 2, href: '/shops', label: 'Shops', short: 'Shops', icon: Store, scope: 'shop' },
  {
    step: 3,
    href: '/products',
    label: 'Products',
    short: 'Products',
    icon: ShoppingBag,
    scope: 'product',
  },
] as const;

const SCOPES = [
  { value: 'all', label: 'Everything' },
  { value: 'market', label: 'Malls' },
  { value: 'shop', label: 'Shops' },
  { value: 'product', label: 'Products' },
];

function TopBar() {
  return (
    <div className="bg-ink text-[12px] text-white/80">
      <div className="container-page flex h-8 items-center gap-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <Phone className="size-3" /> Hotline 09600-000000
        </span>
        <span className="ml-auto truncate">
          Home delivery across Bangladesh · Cash on delivery · or pick up at the mall
        </span>
      </div>
    </div>
  );
}

function SearchBox(props: { className?: string; onDone?: () => void }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const initial = params.get('q') ?? '';
  // The box searches the kind of list you are on.
  const scope = pathname.startsWith('/markets')
    ? 'market'
    : pathname.startsWith('/shops')
      ? 'shop'
      : pathname.startsWith('/products')
        ? 'product'
        : 'all';
  // Remount when the URL changes so the box always shows the current search.
  return (
    <SearchInput key={`${initial}|${scope}`} initial={initial} initialScope={scope} {...props} />
  );
}

function SearchInput({
  initial,
  initialScope,
  className,
  onDone,
}: {
  initial: string;
  initialScope: string;
  className?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [scope, setScope] = useState(
    SCOPES.some(s => s.value === initialScope) ? initialScope : 'all'
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    // One kind goes to that kind's list (with its filters); "everything" shows the best few of each.
    const list =
      scope === 'market'
        ? '/markets'
        : scope === 'shop'
          ? '/shops'
          : scope === 'product'
            ? '/products'
            : null;
    const query = term ? `?q=${encodeURIComponent(term)}` : '';
    if (list) router.push(`${list}${query}`);
    else router.push(term ? `/search${query}` : '/products');
    onDone?.();
  }

  const placeholder =
    scope === 'market'
      ? 'Search a mall or market…'
      : scope === 'shop'
        ? 'Search a shop by name…'
        : scope === 'product'
          ? 'Search a product, e.g. panjabi…'
          : 'Search a mall, a shop or a product…';

  return (
    <form
      onSubmit={submit}
      role="search"
      className={cn(
        'flex h-11 overflow-hidden rounded-md border-2 border-primary bg-background',
        className
      )}
    >
      <label className="relative shrink-0 border-r">
        <span className="sr-only">Search in</span>
        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          className="h-full appearance-none bg-surface pr-7 pl-3 text-sm text-foreground outline-none"
        >
          {SCOPES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </label>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="flex items-center gap-1.5 bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Search className="size-4" /> <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}

function CartButton() {
  const { data } = useCart();
  const count = data?.itemCount ?? 0;
  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
      aria-label={`Cart, ${count} items`}
    >
      <span className="relative">
        <ShoppingCart className="size-5" />
        {count ? (
          <span className="absolute -top-1.5 -right-2 flex min-w-4 items-center justify-center rounded-full bg-deal px-1 text-[10px] leading-4 font-semibold text-white">
            {count}
          </span>
        ) : null}
      </span>
      <span className="hidden text-sm font-medium lg:inline">Cart</span>
    </Link>
  );
}

function useJourneyStep() {
  const pathname = usePathname();
  if (pathname.startsWith('/markets')) return 1;
  if (pathname.startsWith('/shops')) return 2;
  if (pathname.startsWith('/products')) return 3;
  return 0;
}

/** Mall → Shop → Product: the three ways in, shown as one path. */
function JourneyNav() {
  const active = useJourneyStep();
  return (
    <nav className="border-t" aria-label="Browse">
      <ol className="container-page flex h-11 items-center gap-1 text-sm">
        {JOURNEY.map((j, i) => (
          <li key={j.step} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight className="size-4 text-muted-foreground/60" aria-hidden />
            ) : null}
            <Link
              href={j.href}
              aria-current={active === j.step ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground',
                active === j.step && 'bg-accent font-medium text-accent-foreground'
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-[11px] font-semibold',
                  active === j.step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-foreground/30'
                )}
              >
                {j.step}
              </span>
              {j.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-background">
      <TopBar />
      <div className="container-page flex h-16 items-center gap-3 md:gap-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" />}
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="grid gap-0.5 px-4 text-sm">
              {JOURNEY.map(j => (
                <Link
                  key={j.step}
                  href={j.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2.5 hover:bg-muted"
                >
                  <span className="flex size-5 items-center justify-center rounded-full border border-foreground/30 text-[11px] font-semibold">
                    {j.step}
                  </span>
                  {j.label}
                </Link>
              ))}
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-2.5 rounded-md border-t px-2 pt-4 pb-2.5 hover:bg-muted"
              >
                <Package className="size-4" /> My orders
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <Logo className="shrink-0" />
        <Suspense fallback={<div className="hidden h-11 flex-1 md:block" />}>
          <SearchBox className="hidden flex-1 md:flex" />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {user ? null : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <User className="size-5" />
              <span className="hidden leading-tight lg:block">
                <span className="block text-[11px] text-muted-foreground">Hello, sign in</span>
                <span className="font-medium">Account</span>
              </span>
            </Link>
          )}
          <NotificationBell />
          {user ? <UserMenu /> : null}
          <CartButton />
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>
      <div className="hidden md:block">
        <Suspense>
          <JourneyNav />
        </Suspense>
      </div>
      <div className="border-b" />
    </header>
  );
}
