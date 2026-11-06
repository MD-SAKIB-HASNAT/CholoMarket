export const PRODUCT_STATUSES = [
  'draft',
  'active',
  'hidden',
  'archived',
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_CONDITIONS = ['new', 'used', 'refurbished'] as const;

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const WARRANTY_TYPES = ['none', 'shop', 'brand_official'] as const;

export type WarrantyType = (typeof WARRANTY_TYPES)[number];

export const INVENTORY_REASONS = [
  'restock',
  'manual_adjust',
  'offline_sale',
  'reserve',
  'release',
  'online_sale',
  'return',
  'damaged',
  'import',
] as const;

export type InventoryReason = (typeof INVENTORY_REASONS)[number];

export const SEARCH_SCOPES = ['all', 'market', 'shop', 'product'] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];

export const IMPORT_STATUSES = [
  'queued',
  'processing',
  'completed',
  'failed',
] as const;

export type ImportStatus = (typeof IMPORT_STATUSES)[number];
