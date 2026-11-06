export const PAYMENT_METHODS = [
  'bkash',
  'nagad',
  'card',
  'cash',
  'gift_card',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Methods a customer can choose at checkout. */
export const CHECKOUT_PAYMENT_METHODS = ['bkash', 'nagad', 'cash'] as const;

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export const PAYMENT_PURPOSES = ['full', 'deposit', 'balance'] as const;

export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PAYMENT_STATUSES = [
  'initiated',
  'pending',
  'succeeded',
  'failed',
  'cancelled',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const REFUND_STATUSES = [
  'pending',
  'processing',
  'succeeded',
  'failed',
] as const;
