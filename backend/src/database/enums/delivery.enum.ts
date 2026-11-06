/** Home delivery zones used for the delivery charge. */
export const DELIVERY_ZONES = ['inside_dhaka', 'outside_dhaka'] as const;

export type DeliveryZone = (typeof DELIVERY_ZONES)[number];

/** Third-party couriers (3PL). Steadfast first; Pathao, RedX etc. plug in next. */
export const COURIER_PROVIDERS = ['steadfast'] as const;

export type CourierProvider = (typeof COURIER_PROVIDERS)[number];

/** mock = simulated courier for development; live = real API calls with the shop's keys. */
export const COURIER_MODES = ['mock', 'live'] as const;

export type CourierMode = (typeof COURIER_MODES)[number];

/** Our normalised view of a courier's status. The courier's own word is kept in courier_status. */
export const SHIPMENT_STATUSES = [
  'booked',
  'in_transit',
  'on_hold',
  'delivered',
  'partial_delivered',
  'returned',
  'cancelled',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const OPEN_SHIPMENT_STATUSES: ShipmentStatus[] = [
  'booked',
  'in_transit',
  'on_hold',
];

export const VEHICLE_TYPES = ['bicycle', 'motorbike', 'van'] as const;

export const RIDER_STATUSES = [
  'offline',
  'available',
  'busy',
  'suspended',
] as const;

export const DELIVERY_STATUSES = [
  'pending',
  'assigned',
  'collecting',
  'at_hub',
  'out_for_delivery',
  'delivered',
  'failed',
  'returned',
] as const;
