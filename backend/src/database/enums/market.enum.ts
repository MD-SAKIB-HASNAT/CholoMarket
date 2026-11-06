export const AREA_KINDS = ['thana', 'upazila', 'city_area'] as const;

export const MARKET_KINDS = [
  'mall',
  'market',
  'bazaar',
  'wholesale_market',
  'street_market',
] as const;

export type MarketKind = (typeof MARKET_KINDS)[number];

export const MARKET_STATUSES = ['draft', 'active', 'inactive'] as const;

export type MarketStatus = (typeof MARKET_STATUSES)[number];
