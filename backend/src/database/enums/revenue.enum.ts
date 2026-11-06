export const SUBSCRIPTION_STATUSES = [
  'trial',
  'active',
  'past_due',
  'cancelled',
  'expired',
] as const;

export const PAYOUT_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
] as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const LEDGER_KINDS = [
  'sale',
  'commission',
  'refund',
  'payout',
  'subscription_fee',
  'ad_fee',
  'adjustment',
] as const;

export type LedgerKind = (typeof LEDGER_KINDS)[number];

export const AD_ADVERTISERS = ['shop', 'market', 'brand', 'external'] as const;

export const AD_PLACEMENTS = [
  'home_banner',
  'search_top',
  'category_top',
  'market_featured',
  'market_sponsor',
] as const;

export const AD_STATUSES = [
  'draft',
  'scheduled',
  'running',
  'ended',
  'cancelled',
] as const;
