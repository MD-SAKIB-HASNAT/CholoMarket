/* eslint-disable @next/next/no-img-element -- photos come from the API's upload host / image CDN */
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';

/** Resize an Unsplash (imgix) URL; other hosts are returned unchanged. */
export function sized(src: string, width: number): string {
  if (!src.includes('images.unsplash.com')) return src;
  const url = new URL(src);
  url.searchParams.set('w', String(width));
  return url.toString();
}

/** The photo, or a plain "no photo yet" tile. `icon`/`seed` are accepted for older call sites. */
export function Media({
  src,
  alt,
  className,
  width = 600,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  icon?: string | null;
  seed?: string;
  className?: string;
  iconClassName?: string;
  width?: number;
  priority?: boolean;
}) {
  if (src) {
    return (
      <img
        src={sized(src, width)}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('size-full object-cover', className)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'flex size-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground',
        className
      )}
    >
      <ImageOff className="size-5 opacity-60" strokeWidth={1.5} />
      <span className="text-[11px]">No photo yet</span>
    </div>
  );
}

/** Typographic monogram for shops without a logo. */
export function Initials({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(w => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');
  return (
    <div
      className={cn(
        'flex items-center justify-center border bg-surface font-semibold tracking-tight text-ink',
        className
      )}
      aria-hidden
    >
      {letters || name.slice(0, 1)}
    </div>
  );
}
