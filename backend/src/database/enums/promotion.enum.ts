export const COUPON_FUNDERS = ['platform', 'shop', 'market'] as const;

export const DISCOUNT_TYPES = ['percent', 'fixed'] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const GIFT_CARD_STATUSES = [
  'inactive',
  'active',
  'exhausted',
  'expired',
  'blocked',
] as const;

export const GIFT_CARD_TX_KINDS = [
  'issue',
  'redeem',
  'refund',
  'adjust',
] as const;
