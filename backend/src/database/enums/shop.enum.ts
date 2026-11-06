export const SHOP_STATUSES = [
  'pending',
  'active',
  'suspended',
  'closed',
] as const;

export type ShopStatus = (typeof SHOP_STATUSES)[number];

export const VERIFICATION_KINDS = [
  'trade_license',
  'owner_nid',
  'tin',
  'bin_vat',
  'physical_visit',
] as const;

export type VerificationKind = (typeof VERIFICATION_KINDS)[number];

export const VERIFICATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'expired',
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const PAYOUT_METHODS = ['bkash', 'nagad', 'bank'] as const;

export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
