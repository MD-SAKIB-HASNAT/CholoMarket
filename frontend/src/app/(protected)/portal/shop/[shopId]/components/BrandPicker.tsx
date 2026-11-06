'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';
import { api } from '@/utils/api/api';
import type { Brand, CursorPage } from '@/utils/types';

/**
 * Optional brand of a product: type to narrow the list (searches the brand catalogue as you type),
 * then pick from the select. The brand already on the product stays selectable even when it is not in the results.
 */
export function BrandPicker({
  value,
  current,
  onChange,
}: {
  value: string;
  current?: { id: number; name: string } | null;
  onChange: (brandId: string) => void;
}) {
  const [term, setTerm] = useState('');
  const brands = useQuery({
    queryKey: ['brands', 'picker', term.trim()],
    queryFn: () =>
      api<CursorPage<Brand>>(PORTAL_ENDPOINTS.shared.brands, {
        token: null,
        query: { limit: 50, q: term.trim() || undefined, includeUnused: true },
      }),
    staleTime: 5 * 60_000,
  });
  const options = brands.data?.items ?? [];
  const showCurrent =
    !!current && String(current.id) === value && !options.some(b => b.id === current.id);

  return (
    <Field label="Brand" htmlFor="brand" hint="Optional. Shoppers can filter products by brand.">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Search brands…"
          aria-label="Search brands"
          maxLength={60}
        />
        <NativeSelect id="brand" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">No brand</option>
          {showCurrent ? <option value={current.id}>{current.name}</option> : null}
          {options.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>
      </div>
    </Field>
  );
}
