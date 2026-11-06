const taka = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** ৳1,23,450 (South Asian digit grouping). */
/** 320 → "320 m", 1250 → "1.3 km". */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km >= 10) return `${Math.round(km)} km`;
  if (km >= 1) return `${km.toFixed(1).replace(/\.0$/, '')} km`;
  return `${km.toFixed(2).replace(/0$/, '').replace(/\.0$/, '')} km`;
}

/** "Road 27, Dhanmondi" (neighbourhood, area), or the full chain with `full`. */
export function locationLabel(
  place: {
    area?: { nameEn: string; district?: { nameEn: string; division?: { nameEn: string } } } | null;
    subArea?: { nameEn: string } | null;
  },
  full = false
): string {
  const parts = [place.subArea?.nameEn, place.area?.nameEn];
  if (full) parts.push(place.area?.district?.nameEn, place.area?.district?.division?.nameEn);
  return parts.filter(Boolean).join(', ');
}

export function formatTaka(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `৳${taka.format(n)}`;
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: 'numeric', minute: '2-digit', hour12: true }),
  });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export function timeLeft(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

/** +8801711000001 -> 01711-000001 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const local = phone.replace(/^\+88/, '');
  return local.length === 11 ? `${local.slice(0, 5)}-${local.slice(5)}` : local;
}

export const humanize = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatTime(t: string | null | undefined): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, '0')}` : ''}${suffix}`;
}

export function floorLabel(level: number): string {
  if (level === 999) return 'Other';
  if (level < 0) return `B${Math.abs(level)}`;
  return level === 0 ? 'G' : `L${level}`;
}

export const MARKET_KIND_LABEL: Record<string, string> = {
  mall: 'Shopping mall',
  market: 'Market',
  bazaar: 'Bazaar',
  wholesale_market: 'Wholesale market',
  street_market: 'Street market',
};

export function variantText(attributes: Record<string, string> | null | undefined): string {
  const values = Object.values(attributes ?? {}).filter(Boolean);
  return values.join(' / ');
}

/** plural(1, "item") -> "1 item", plural(3, "item") -> "3 items" */
export const plural = (n: number, word: string, many = `${word}s`) =>
  `${n} ${n === 1 ? word : many}`;
