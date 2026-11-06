'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

/**
 * The foot of a cursor-paged list: a "Show more" button that also fires by itself when it scrolls
 * into view (`auto`, for long feeds) — people who never scroll can still press it.
 * Renders nothing once the list has no more pages.
 */
export function LoadMore({
  hasMore,
  loading,
  onLoad,
  label = 'Show more',
  auto = false,
  className,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoad: () => void;
  label?: string;
  auto?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!auto || !el || !hasMore) return;
    const watcher = new IntersectionObserver(
      entries => entries[0]?.isIntersecting && !loading && onLoad(),
      { rootMargin: '400px' }
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [auto, hasMore, loading, onLoad]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className={className ?? 'mt-6 flex justify-center'}>
      <Button variant="outline" onClick={onLoad} disabled={loading}>
        {loading ? <LoaderCircle className="animate-spin" /> : null} {label}
      </Button>
    </div>
  );
}
