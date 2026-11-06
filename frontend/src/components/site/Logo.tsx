import Link from 'next/link';
import { cn } from '@/utils/helpers/cn';

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Cholo Market';

/**
 * Someone walking freely to the market ("cholo" = let's go): shopping bag slung behind the back,
 * right hand up at the neck holding the strap. The same drawing is used in the banner artwork
 * (frontend/scripts/banners) and app/icon.svg.
 */
export function WalkerMark({ className, light = false }: { className?: string; light?: boolean }) {
  const body = light ? 'stroke-white' : 'stroke-primary';
  return (
    <svg
      viewBox="0 0 40 36"
      aria-hidden
      className={cn('h-8 w-auto', className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* bag hanging behind the back */}
      <g transform="rotate(-8 9 22)">
        <path d="M6.6 17.2V15.8a2.6 2.6 0 0 1 5.2 0v1.4" strokeWidth="1.4" className={body} />
        <rect
          x="3.6"
          y="17.2"
          width="11"
          height="10.6"
          rx="1.8"
          className="fill-bargain"
          stroke="none"
        />
      </g>
      {/* strap: from the hand at the neck, over the shoulder, down to the bag */}
      <path
        d="M22.6 10.4C17.4 10.2 13.4 12.2 10.6 16.8"
        strokeWidth="1.6"
        className="stroke-bargain"
      />
      <g className={body}>
        <path d="M24.2 11.4 20.8 22" strokeWidth="3.8" />
        <path d="M24 12.6 17.8 15.8 22.4 9.9" strokeWidth="2.8" />
        <path d="M24.6 12.6 28.8 16.4 32 19.8" strokeWidth="2.8" />
        <path d="M20.8 22 25.6 27.6 28.8 33.4" strokeWidth="3.4" />
        <path d="M20.8 22 16.6 27.8 12.4 32.4" strokeWidth="3.4" />
      </g>
      <circle
        cx="25.8"
        cy="6.2"
        r="3.7"
        className={light ? 'fill-white' : 'fill-primary'}
        stroke="none"
      />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('inline-flex items-end gap-2 leading-none', className)}
      aria-label={`${APP_NAME} home`}
    >
      <WalkerMark />
      {compact ? null : (
        <span className="text-[1.4rem] font-bold tracking-[-0.03em] text-primary">
          cholo<span className="font-medium text-foreground">market</span>
        </span>
      )}
    </Link>
  );
}
