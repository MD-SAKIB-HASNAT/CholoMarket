'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/helpers/cn';

/** "Search by name" for a list page: types into ?q= (after a short pause) and keeps the other filters. */
export function SearchField(props: { placeholder: string; className?: string }) {
  const current = useSearchParams().get('q') ?? '';
  // Start over when the address changes from elsewhere (e.g. "Clear"), so the box always shows what is applied.
  return <SearchInput key={current} current={current} {...props} />;
}

function SearchInput({
  current,
  placeholder,
  className,
}: {
  current: string;
  placeholder: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const [text, setText] = useState(current);

  useEffect(() => {
    const term = text.trim();
    if (term === current) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(query);
      if (term) next.set('q', term);
      else next.delete('q');
      router.push(`${pathname}${next.size ? `?${next}` : ''}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [text, current, query, pathname, router]);

  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-full border bg-card pr-9 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {text ? (
        <button
          type="button"
          onClick={() => setText('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </label>
  );
}
