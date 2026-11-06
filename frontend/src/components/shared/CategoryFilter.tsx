'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api/api';
import type { Category } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { NativeSelect } from '@/components/shared/FormBits';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

/** Category picker for a list page (top-level categories group their sub-categories); sets ?categoryId=. */
export function CategoryFilter({
  className,
  alsoClear = [],
}: {
  className?: string;
  alsoClear?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get('categoryId') ?? '';
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>(STORE_ENDPOINTS.categories.list, { token: null }),
    staleTime: 30 * 60_000,
  });

  return (
    <NativeSelect
      aria-label="Category"
      value={value}
      onChange={e => {
        const next = new URLSearchParams(params);
        if (e.target.value) next.set('categoryId', e.target.value);
        else next.delete('categoryId');
        // Other filters that depend on the category (e.g. brand) start over.
        for (const key of alsoClear) next.delete(key);
        router.push(`${pathname}${next.size ? `?${next}` : ''}`);
      }}
      className={cn(
        'h-9 w-auto min-w-40 max-w-56 bg-card',
        value && 'border-primary text-ink',
        className
      )}
    >
      <option value="">All categories</option>
      {categories.data?.map(root => (
        <optgroup key={root.id} label={root.nameEn}>
          <option value={root.id}>All {root.nameEn}</option>
          {root.children?.map(c => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </optgroup>
      ))}
    </NativeSelect>
  );
}
