'use client';

import { useAuth } from '@/utils/context/AuthContext';
import type { Me } from '@/utils/types';

export type PlatformRole = NonNullable<Me['platformRole']>;

/** Mirrors the @Roles(...) of the admin routes. super_admin always passes. */
export const PERMS = {
  markets: ['ops', 'onboarding'],
  locations: ['ops', 'onboarding'],
  shops: ['ops', 'onboarding'],
  marketMembers: ['ops'],
  subscription: ['finance', 'ops'],
  categories: ['ops'],
  commission: ['finance'],
  coupons: ['ops', 'finance'],
  banners: ['ops'],
  brands: ['ops', 'onboarding'],
  payouts: ['finance'],
  financeView: ['finance'],
  settings: [],
  staffRole: [],
  userStatus: ['ops', 'support'],
} satisfies Record<string, PlatformRole[]>;

export type Perm = keyof typeof PERMS;

export function useAdminRole() {
  const { user } = useAuth();
  const role = user?.platformRole ?? null;
  const can = (perm: Perm) =>
    role === 'super_admin' || (!!role && (PERMS[perm] as PlatformRole[]).includes(role));
  return { role, can, user };
}

export const ROLE_LABEL: Record<PlatformRole, string> = {
  super_admin: 'Super admin',
  ops: 'Operations',
  onboarding: 'Onboarding',
  support: 'Support',
  finance: 'Finance',
};

/** <input type="datetime-local"> value for a date (local time). */
export function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Strip empty strings so optional DTO fields are omitted. */
export function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined)
  ) as Partial<T>;
}

/** "HH:MM:SS" from Postgres -> "HH:MM" for <input type="time">. */
export const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : '');

/** The ids a market's location selects start from (the API returns the area with its district and division). */
export function marketLocationIds(m: {
  areaId: number;
  subAreaId?: number | null;
  area?: { district?: { id: number; divisionId?: number } } | null;
}) {
  return {
    divisionId: m.area?.district?.divisionId ? String(m.area.district.divisionId) : '',
    districtId: m.area?.district?.id ? String(m.area.district.id) : '',
    areaId: m.areaId ? String(m.areaId) : '',
    subAreaId: m.subAreaId ? String(m.subAreaId) : '',
  };
}

/** "Division › District › Area › Sub-area" for a market. */
export function marketLocationPath(m: {
  area?: { nameEn: string; district?: { nameEn: string; division?: { nameEn: string } } } | null;
  subArea?: { nameEn: string } | null;
}) {
  return [
    m.area?.district?.division?.nameEn,
    m.area?.district?.nameEn,
    m.area?.nameEn,
    m.subArea?.nameEn,
  ]
    .filter(Boolean)
    .join(' › ');
}
