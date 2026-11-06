export const ORDER_STATUSES = [
  'pending_payment',
  'placed',
  'in_progress',
  'completed',
  'partially_completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_PAYMENT_STATUSES = [
  'unpaid',
  'deposit_paid',
  'paid',
  'partially_refunded',
  'refunded',
] as const;

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const SHOP_ORDER_STATUSES = [
  'placed',
  'confirmed',
  'ready_for_pickup',
  'shipped',
  'handed_to_rider',
  'out_for_delivery',
  'completed',
  'rejected',
  'cancelled',
  'expired',
  'returned',
] as const;

export type ShopOrderStatus = (typeof SHOP_ORDER_STATUSES)[number];

/** Statuses in which stock is still held for the customer. */
export const OPEN_SHOP_ORDER_STATUSES: ShopOrderStatus[] = [
  'placed',
  'confirmed',
  'ready_for_pickup',
];

export const FULFILLMENT_TYPES = [
  'shop_pickup',
  'desk_pickup',
  'delivery',
] as const;

export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];

export const ORDER_ITEM_STATUSES = [
  'active',
  'cancelled',
  'returned',
  'partially_returned',
] as const;

export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];
