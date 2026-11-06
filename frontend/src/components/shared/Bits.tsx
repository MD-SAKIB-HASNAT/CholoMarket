import { BadgeCheck, Star, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTaka, humanize } from '@/utils/helpers/format';
import { cn } from '@/utils/helpers/cn';

export function Price({
  value,
  compareAt,
  className,
  size = 'md',
  hidePercent = false,
}: {
  value: number | null | undefined;
  compareAt?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Product cards show the discount as a tag on the photo instead. */
  hidePercent?: boolean;
}) {
  const showCompare = compareAt && value && compareAt > value;
  const off = showCompare ? Math.round(((compareAt - value) / compareAt) * 100) : 0;
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span
        className={cn(
          'font-semibold text-ink tabular-nums',
          size === 'lg' ? 'text-[1.75rem]' : size === 'sm' ? 'text-sm' : 'text-base'
        )}
      >
        {formatTaka(value)}
      </span>
      {showCompare ? (
        <>
          <span className="text-xs text-muted-foreground tabular-nums line-through">
            {formatTaka(compareAt)}
          </span>
          {hidePercent ? null : <span className="text-xs font-medium text-deal">−{off}%</span>}
        </>
      ) : null}
    </span>
  );
}

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count: number;
  className?: string;
}) {
  if (!count)
    return <span className={cn('text-xs text-muted-foreground', className)}>No reviews yet</span>;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', className)}>
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium tabular-nums">{value.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}

export function VerifiedBadge({
  className,
  withText = false,
}: {
  className?: string;
  withText?: boolean;
}) {
  const icon = (
    <BadgeCheck
      className={cn('size-4 shrink-0 text-sky-600', className)}
      aria-label="Verified shop"
    />
  );
  if (withText) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-700">
        {icon} Verified shop
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{icon}</TooltipTrigger>
      <TooltipContent>Verified: trade licence checked and shop visited in person</TooltipContent>
    </Tooltip>
  );
}

const STATUS_TONE: Record<string, string> = {
  // orders
  pending_payment: 'bg-amber-50 text-amber-800 border-amber-200',
  placed: 'bg-sky-50 text-sky-800 border-sky-200',
  confirmed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  in_progress: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  ready_for_pickup: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completed: 'bg-emerald-600 text-white border-emerald-600',
  partially_completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
  cancelled: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  expired: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  shipped: 'bg-violet-50 text-violet-800 border-violet-200',
  returned: 'bg-rose-50 text-rose-800 border-rose-200',
  // courier parcels
  booked: 'bg-sky-50 text-sky-800 border-sky-200',
  in_transit: 'bg-violet-50 text-violet-800 border-violet-200',
  on_hold: 'bg-amber-50 text-amber-800 border-amber-200',
  delivered: 'bg-emerald-600 text-white border-emerald-600',
  partial_delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  // payments
  unpaid: 'bg-amber-50 text-amber-800 border-amber-200',
  deposit_paid: 'bg-sky-50 text-sky-800 border-sky-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  refunded: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  partially_refunded: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  succeeded: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  failed: 'bg-rose-50 text-rose-800 border-rose-200',
  initiated: 'bg-amber-50 text-amber-800 border-amber-200',
  // offers
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  countered: 'bg-violet-50 text-violet-800 border-violet-200',
  accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  used: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  withdrawn: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  // shops / generic
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  suspended: 'bg-rose-50 text-rose-800 border-rose-200',
  closed: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  draft: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  hidden: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  archived: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  inactive: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  requested: 'bg-amber-50 text-amber-800 border-amber-200',
  item_received: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  queued: 'bg-amber-50 text-amber-800 border-amber-200',
  processing: 'bg-sky-50 text-sky-800 border-sky-200',
};

const STATUS_LABEL: Record<string, string> = {
  ready_for_pickup: 'Ready for pickup',
  pending_payment: 'Awaiting payment',
  deposit_paid: 'Advance paid',
  shipped: 'With courier',
  in_transit: 'On the way',
  partial_delivered: 'Partly delivered',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_TONE[status] ?? '', className)}>
      {STATUS_LABEL[status] ?? humanize(status)}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center',
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b pb-2">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-[1.35rem]">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Bangla text styled a touch smaller under its English counterpart. */
export function Bn({ children, className }: { children: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <span
      lang="bn"
      className={cn('font-[family-name:var(--font-bangla)] text-muted-foreground', className)}
    >
      {children}
    </span>
  );
}
