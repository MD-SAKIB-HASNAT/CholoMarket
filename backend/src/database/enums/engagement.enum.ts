export const MESSAGE_SIDES = ['customer', 'shop', 'system'] as const;

export type MessageSide = (typeof MESSAGE_SIDES)[number];

export const OFFER_STATUSES = [
  'pending',
  'countered',
  'accepted',
  'rejected',
  'withdrawn',
  'expired',
  'used',
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];
