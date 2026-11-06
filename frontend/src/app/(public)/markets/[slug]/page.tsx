import { CalendarClock, Clock, MapPin, PackageCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Bn } from '@/components/shared/Bits';
import { Media } from '@/components/shared/Media';
import { serverApi } from '@/utils/api/api';
import {
  MARKET_KIND_LABEL,
  WEEKDAYS,
  floorLabel,
  formatTime,
  locationLabel,
} from '@/utils/helpers/format';
import type { Directory, Market } from '@/utils/types';
import { MallWalkthrough } from './components/Walkthrough';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export async function generateMetadata({
  params,
}: PageProps<'/markets/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const market = await serverApi<Market>(STORE_ENDPOINTS.markets.bySlug(slug));
  return { title: market ? `${market.nameEn} — shops & floor guide` : 'Market' };
}

export default async function MarketPage({ params }: PageProps<'/markets/[slug]'>) {
  const { slug } = await params;
  const [market, directory] = await Promise.all([
    serverApi<Market>(STORE_ENDPOINTS.markets.bySlug(slug)),
    serverApi<Directory>(STORE_ENDPOINTS.markets.directory(slug)),
  ]);
  if (!market || !directory) notFound();

  return (
    <div>
      <section className="relative h-56 overflow-hidden bg-ink sm:h-80">
        <Media src={market.coverUrl} alt={market.nameEn} width={1800} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-sm bg-white/95 text-ink">
              {MARKET_KIND_LABEL[market.kind]}
            </Badge>
            {market.isPartner ? (
              <Badge className="rounded-sm bg-primary text-white">Official partner</Badge>
            ) : null}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {market.nameEn}
          </h1>
          <p lang="bn" className="text-lg opacity-90">
            {market.nameBn}
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <MallWalkthrough market={market} directory={directory} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-3 rounded-xl border bg-card p-4 text-sm">
            {market.description ? (
              <p className="text-muted-foreground">{market.description}</p>
            ) : null}
            <p className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {market.addressLine}
                <span className="block text-xs text-muted-foreground">
                  {locationLabel(market, true)}
                </span>
                {market.area ? (
                  <Bn className="block text-xs">
                    {[market.subArea?.nameBn, market.area.nameBn].filter(Boolean).join('، ')}
                  </Bn>
                ) : null}
              </span>
            </p>
            {market.opensAt ? (
              <p className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
                {formatTime(market.opensAt)} – {formatTime(market.closesAt)}
              </p>
            ) : null}
            {market.weeklyOffDay !== null ? (
              <p className="flex gap-2">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" /> Closed on{' '}
                {WEEKDAYS[market.weeklyOffDay]}
              </p>
            ) : null}
            {market.latitude && market.longitude ? (
              <a
                className="inline-block text-primary hover:underline"
                href={`https://www.google.com/maps/search/?api=1&query=${market.latitude},${market.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>

          {market.pickupPoints?.length ? (
            <div className="space-y-3 rounded-xl border bg-card p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <PackageCheck className="size-4 text-primary" /> Pickup desks
              </p>
              <p className="text-xs text-muted-foreground">
                Shopping from several shops here? Collect everything in one place at checkout.
              </p>
              {market.pickupPoints.map(p => (
                <div key={p.id} className="rounded-lg bg-muted/50 p-3">
                  <p className="font-medium">{p.nameEn}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.floor ? `${floorLabel(p.floor.level)} · ` : ''}
                    {p.instructions}
                  </p>
                  {p.opensAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(p.opensAt)} – {formatTime(p.closesAt)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
