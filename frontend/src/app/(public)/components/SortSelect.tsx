'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { NativeSelect } from '@/components/shared/FormBits';

const SORTS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'nearest', label: 'Nearest first' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'discount', label: 'Biggest discount' },
];

/** Updates ?sort= in the URL. "Best match" needs a search word and "Nearest first" needs Nearby. */
export function SortSelect({
  value,
  withRelevance = false,
  withNearest = false,
}: {
  value: string;
  withRelevance?: boolean;
  withNearest?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <NativeSelect
      aria-label="Sort products"
      className="h-9 w-auto bg-card"
      value={value}
      onChange={e => {
        const next = new URLSearchParams(params);
        next.set('sort', e.target.value);
        router.push(`${pathname}?${next}`);
      }}
    >
      {SORTS.filter(
        s => (s.value !== 'relevance' || withRelevance) && (s.value !== 'nearest' || withNearest)
      ).map(s => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </NativeSelect>
  );
}
