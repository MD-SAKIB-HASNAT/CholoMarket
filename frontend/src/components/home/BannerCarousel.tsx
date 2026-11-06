'use client';

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Media } from '@/components/shared/Media';
import type { Banner } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';

const LABEL: Record<string, string> = {
  market: 'Mall offer',
  shop: 'From the shops',
  external: 'Cholo Market',
};

/** Home-page banners (ad campaigns): one slide at a time, auto-advancing until the visitor takes over. */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [paused, count]);

  if (!count) return null;
  const go = (i: number) => {
    setIndex((i + count) % count);
    setPaused(true);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="group/banner relative overflow-hidden rounded-md bg-ink">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b, i) => (
            <Link
              key={b.id}
              href={b.linkUrl ?? '/markets'}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
              aria-label={b.imageHasText ? (b.title ?? undefined) : undefined}
              // 3:2 on phones, 16:5 from tablets up: the sizes the artwork is made for.
              className="relative block aspect-[3/2] w-full shrink-0 md:aspect-[16/5]"
            >
              {b.imageHasText ? (
                <picture>
                  <source media="(min-width: 768px)" srcSet={b.imageUrl ?? undefined} />
                  <img
                    src={b.mobileImageUrl ?? b.imageUrl ?? undefined}
                    alt={b.title ?? ''}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="absolute inset-0 size-full object-cover"
                  />
                </picture>
              ) : (
                <>
                  <Media
                    src={b.imageUrl}
                    alt=""
                    width={1800}
                    priority={i === 0}
                    className="absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/0" />
                  <div className="relative flex h-full max-w-xl flex-col justify-end gap-2 p-5 text-white md:justify-center lg:p-10">
                    <span className="w-fit rounded-sm bg-white/15 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase backdrop-blur-sm">
                      {LABEL[b.advertiser] ?? 'Offer'}
                    </span>
                    <p className="text-2xl leading-tight font-semibold lg:text-4xl">{b.title}</p>
                    {b.subtitle ? (
                      <p className="line-clamp-2 text-sm text-white/85 lg:text-base">
                        {b.subtitle}
                      </p>
                    ) : null}
                    <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-sm bg-white px-4 py-2 text-sm font-medium text-ink">
                      Explore now <ArrowRight className="size-4" />
                    </span>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous offer"
              className="absolute top-1/2 left-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 shadow transition group-hover/banner:opacity-100 sm:flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next offer"
              className="absolute top-1/2 right-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 shadow transition group-hover/banner:opacity-100 sm:flex"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      {/* Below the picture, so they never cover artwork that has its own text. */}
      {count > 1 ? (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show offer ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/20 hover:bg-foreground/40'
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
