// Single source of truth for every status / kind value stored in the database.
// Entities turn these into CHECK constraints, DTOs into validation rules.

export const PLATFORM_ROLES = [
  'super_admin',
  'ops',
  'onboarding',
  'support',
  'finance',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const MARKET_ROLES = ['admin', 'manager', 'desk_staff'] as const;

export type MarketRole = (typeof MARKET_ROLES)[number];

export const SHOP_ROLES = ['owner', 'manager', 'staff'] as const;

export type ShopRole = (typeof SHOP_ROLES)[number];

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const DEVICE_PLATFORMS = ['android', 'ios', 'web'] as const;
