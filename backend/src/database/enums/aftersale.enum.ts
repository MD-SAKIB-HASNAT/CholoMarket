export const RETURN_REASONS = [
  'wrong_size',
  'defective',
  'not_as_described',
  'wrong_item',
  'changed_mind',
  'warranty_claim',
  'other',
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_RESOLUTIONS = [
  'refund',
  'exchange',
  'store_credit',
  'repair',
] as const;

export const RETURN_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'item_received',
  'resolved',
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const REVIEW_STATUSES = ['published', 'hidden'] as const;

export const TICKET_CHANNELS = [
  'hotline',
  'app',
  'chat',
  'email',
  'facebook',
] as const;

export const TICKET_CATEGORIES = [
  'order',
  'payment',
  'refund',
  'shop_complaint',
  'fraud',
  'account',
  'other',
] as const;

export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed',
] as const;

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
