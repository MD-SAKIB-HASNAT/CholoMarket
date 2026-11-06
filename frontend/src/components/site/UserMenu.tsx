'use client';

import {
  Building2,
  Handshake,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Initials } from '@/components/shared/Media';
import { useAuth } from '@/utils/context/AuthContext';
import { formatPhone } from '@/utils/helpers/format';

export function UserMenu() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return <div className="size-8 animate-pulse rounded-full bg-muted" />;
  if (!user) {
    return (
      <Button size="sm" render={<Link href="/login" />}>
        <User /> Log in
      </Button>
    );
  }

  const name = user.fullName || formatPhone(user.phone);
  const go = (href: string) => () => router.push(href);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu" />
        }
      >
        <Initials name={name} className="size-8 rounded-full text-xs" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate font-medium text-foreground">{name}</p>
            <p className="text-xs font-normal text-muted-foreground">{formatPhone(user.phone)}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={go('/orders')}>
            <Package /> My orders
          </DropdownMenuItem>
          <DropdownMenuItem onClick={go('/offers')}>
            <Handshake /> My offers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={go('/messages')}>
            <MessageCircle /> Messages
          </DropdownMenuItem>
          <DropdownMenuItem onClick={go('/wishlist')}>
            <Heart /> Wishlist
          </DropdownMenuItem>
          <DropdownMenuItem onClick={go('/account')}>
            <User /> Account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {user.shops.length || user.markets.length || user.platformRole ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">Dashboards</DropdownMenuLabel>
              {user.shops.map(s => (
                <DropdownMenuItem key={`s${s.shopId}`} onClick={go(`/portal/shop/${s.shopId}`)}>
                  <Store /> <span className="truncate">{s.name}</span>
                </DropdownMenuItem>
              ))}
              {user.markets.map(m => (
                <DropdownMenuItem
                  key={`m${m.marketId}`}
                  onClick={go(`/portal/market/${m.marketId}`)}
                >
                  <Building2 /> <span className="truncate">{m.name}</span>
                </DropdownMenuItem>
              ))}
              {user.platformRole ? (
                <DropdownMenuItem onClick={go('/admin')}>
                  <ShieldCheck /> Admin console
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            router.push('/');
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardsLink() {
  const { user } = useAuth();
  if (!user) return null;
  const href = user.platformRole
    ? '/admin'
    : user.shops[0]
      ? `/portal/shop/${user.shops[0].shopId}`
      : user.markets[0]
        ? `/portal/market/${user.markets[0].marketId}`
        : null;
  if (!href) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      render={<Link href={href} />}
      className="hidden md:inline-flex"
    >
      <LayoutDashboard /> Dashboard
    </Button>
  );
}
