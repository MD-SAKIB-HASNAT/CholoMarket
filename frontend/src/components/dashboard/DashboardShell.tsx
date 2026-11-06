'use client';

import { Menu, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/site/Logo';
import { UserMenu } from '@/components/site/UserMenu';
import { NotificationBell } from '@/components/site/NotificationBell';
import { cn } from '@/utils/helpers/cn';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact match only (for the dashboard root). */
  exact?: boolean;
  badge?: number;
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-0.5">
      {items.map(item => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              active && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Sidebar layout shared by the shop portal, market portal and admin console.
 * `context` is the switcher/heading block shown above the nav (e.g. shop name).
 */
export function DashboardShell({
  title,
  context,
  nav,
  children,
}: {
  title: string;
  context?: ReactNode;
  nav: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-svh bg-muted/30">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-4 border-r bg-sidebar p-3 lg:flex">
        <div className="px-1 pt-1">
          <Logo />
        </div>
        {context}
        <NavLinks items={nav} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-3">
              <SheetHeader className="p-1">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              {context}
              <NavLinks items={nav} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="truncate font-semibold">{title}</p>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: 'default' | 'warning' | 'success';
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              'flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground',
              tone === 'warning' && 'bg-amber-50 text-amber-700',
              tone === 'success' && 'bg-emerald-50 text-emerald-700'
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border bg-card', className)}>
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="font-medium">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
