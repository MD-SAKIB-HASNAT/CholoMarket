'use client';

import { useState } from 'react';
import { Media } from '@/components/shared/Media';
import type { ProductImage } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';

export function Gallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
  icon?: string | null;
  seed?: string;
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-md bg-muted">
        <Media src={images[active]?.url} alt={name} width={1100} priority />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-sm border-2',
                i === active ? 'border-primary' : 'border-transparent'
              )}
              aria-label={`Show photo ${i + 1}`}
            >
              <Media src={img.url} alt="" width={160} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
