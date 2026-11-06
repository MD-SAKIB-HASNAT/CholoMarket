// Shapes returned by the NestJS API (only the fields the UI uses).

/** What every list returns: one page plus the cursor for the next (`?cursor=`); no totals. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Set on "nearby" results: the admin-configured search radius in metres. */
  radiusMeters?: number;
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  productCount: number;
}

/** Headline numbers for the home page (GET /stats). */
export interface Stats {
  markets: number;
  shops: number;
  products: number;
}

export interface Area {
  id: number;
  nameEn: string;
  nameBn: string;
  district?: {
    id: number;
    nameEn: string;
    nameBn: string;
    division?: { id?: number; nameEn: string; nameBn?: string };
  };
}

export interface SubArea {
  id: number;
  areaId: number;
  nameEn: string;
  nameBn: string;
}

/** One row of a location picker (division, district, area or sub-area). */
export interface GeoOption {
  id: number;
  nameEn: string;
  nameBn: string;
}

export interface Category {
  id: number;
  parentId: number | null;
  slug: string;
  nameEn: string;
  nameBn: string;
  icon: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  parent?: Category | null;
  shopCount?: number;
}

export interface Floor {
  id: number;
  marketId?: number;
  level: number;
  nameEn: string;
  nameBn: string | null;
  mapImageUrl: string | null;
}

export interface PickupPoint {
  id: number;
  marketId: number;
  floorId: number | null;
  floor?: Floor | null;
  nameEn: string;
  nameBn: string | null;
  instructions: string | null;
  opensAt: string | null;
  closesAt: string | null;
  isHub: boolean;
  isActive: boolean;
}

export type MarketKind = 'mall' | 'market' | 'bazaar' | 'wholesale_market' | 'street_market';

export interface Market {
  id: number;
  slug: string;
  nameEn: string;
  nameBn: string;
  kind: MarketKind;
  description: string | null;
  areaId: number;
  area?: Area;
  subAreaId?: number | null;
  subArea?: SubArea | null;
  /** Only on "nearby" results. */
  distanceMeters?: number;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  coverUrl: string | null;
  opensAt: string | null;
  closesAt: string | null;
  weeklyOffDay: number | null;
  isPartner: boolean;
  status: 'draft' | 'active' | 'inactive';
  floors?: Floor[];
  pickupPoints?: PickupPoint[];
  shopCount?: number;
  categories?: Category[];
}

export interface Shop {
  id: number;
  slug: string;
  /** Only on "nearby" results: how far the shop (its market) is from the customer. */
  distanceMeters?: number;
  marketId: number | null;
  market?: Market | null;
  floorId: number | null;
  floor?: Floor | null;
  shopNumber: string | null;
  block: string | null;
  walkOrder: number | null;
  mapX: number | null;
  mapY: number | null;
  nameEn: string;
  nameBn: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  primaryCategoryId: number | null;
  primaryCategory?: Category | null;
  acceptsOffers: boolean;
  acceptsCashOnPickup: boolean;
  offersDelivery: boolean;
  depositPercent: number;
  reservationHours: number;
  returnWindowDays: number;
  returnPolicy: string | null;
  warrantyPolicy: string | null;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface ShopDetail extends Shop {
  categories: Category[];
  hours: { weekday: number; opensAt: string | null; closesAt: string | null; isClosed: boolean }[];
  productCount: number;
  followerCount: number;
  isFollowing: boolean;
}

export interface ProductCard {
  id: number;
  slug: string;
  nameEn: string;
  nameBn: string | null;
  minPrice: number | null;
  compareAtPrice: number | null;
  isNegotiable: boolean;
  ratingAvg: number;
  ratingCount: number;
  imageUrl: string | null;
  inStock: boolean;
  category: { id: number; slug: string; nameEn: string; icon: string | null };
  shop: {
    id: number;
    slug: string;
    nameEn: string;
    isVerified: boolean;
    market: { id: number; slug: string; nameEn: string } | null;
  };
}

export interface Variant {
  id: number;
  productId: number;
  sku: string | null;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  minOfferPrice?: number | null;
  stockQty: number;
  reservedQty: number;
  availableQty: number;
  lowStockThreshold: number;
  stockUpdatedAt: string;
  isActive: boolean;
}

export interface ProductImage {
  id: number;
  url: string;
  sortOrder: number;
}

export interface Product {
  id: number;
  shopId: number;
  categoryId: number;
  slug: string;
  nameEn: string;
  nameBn: string | null;
  description: string | null;
  condition: 'new' | 'used' | 'refurbished';
  warrantyType: 'none' | 'shop' | 'brand_official';
  warrantyMonths: number | null;
  isNegotiable: boolean;
  minPrice: number | null;
  status: 'draft' | 'active' | 'hidden' | 'archived';
  ratingAvg: number;
  ratingCount: number;
  variants: Variant[];
  images: ProductImage[];
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  shop: Shop;
  brand: { id: number; name: string } | null;
  sizeChart: { name: string; chart: { columns: string[]; rows: string[][] } } | null;
  inWishlist: boolean;
  canMakeOffer: boolean;
  related: ProductCard[];
}

export interface User {
  id: number;
  phone: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  preferredLanguage: 'bn' | 'en';
  noShowCount: number;
  status: string;
  createdAt: string;
}

export interface Me extends User {
  platformRole: 'super_admin' | 'ops' | 'onboarding' | 'support' | 'finance' | null;
  shops: {
    shopId: number;
    role: 'owner' | 'manager' | 'staff';
    name: string;
    slug: string;
    status: string;
  }[];
  markets: {
    marketId: number;
    role: 'admin' | 'manager' | 'desk_staff';
    name: string;
    slug: string;
  }[];
}

export interface CartLine {
  id: number;
  quantity: number;
  variantId: number;
  productId: number;
  productName: string;
  productNameBn: string | null;
  variantLabel: string | null;
  imageUrl: string | null;
  listPrice: number;
  unitPrice: number;
  lineTotal: number;
  availableQty: number;
  offerId: number | null;
  issues: string[];
}

export interface CartGroup {
  shop: {
    id: number;
    slug: string;
    nameEn: string;
    nameBn: string | null;
    isVerified: boolean;
    acceptsCashOnPickup: boolean;
    offersDelivery?: boolean;
    depositPercent: number;
    reservationHours: number;
    shopNumber: string | null;
    market: { id: number; slug: string; nameEn: string } | null;
  };
  items: CartLine[];
  subtotal: number;
}

export interface Cart {
  id: number;
  groups: CartGroup[];
  subtotal: number;
  itemCount: number;
}

export type ShopOrderStatus =
  | 'placed'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'shipped'
  | 'returned'
  | 'handed_to_rider'
  | 'out_for_delivery'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type OrderStatus =
  'pending_payment' | 'placed' | 'in_progress' | 'completed' | 'partially_completed' | 'cancelled';

export interface OrderItem {
  id: number;
  shopOrderId: number;
  variantId: number;
  productId: number;
  productName: string;
  variantLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  listPrice: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  offerId: number | null;
  commissionRate: number;
  commissionAmount: number;
  status: 'active' | 'cancelled' | 'returned' | 'partially_returned';
  returnedQty: number;
}

export interface ShopOrderEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
  actor?: { id: number; fullName: string | null } | null;
}

export interface ShopOrder {
  id: number;
  orderId: number;
  shopId: number;
  shop?: Shop;
  subOrderNo: string;
  status: ShopOrderStatus;
  fulfillmentType: 'shop_pickup' | 'desk_pickup' | 'delivery';
  pickupPointId: number | null;
  pickupPoint?: PickupPoint | null;
  pickupCode?: string;
  reservedUntil: string | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  commissionTotal: number;
  deliveryFee: number;
  cashDue: number;
  confirmedAt: string | null;
  readyAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItem[];
  events?: ShopOrderEvent[];
  order?: Order;
  shipment?: Shipment | null;
  createdAt: string;
}

export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka';

export interface DeliveryAddress {
  recipientName: string;
  phone: string;
  district: string;
  areaName: string;
  addressLine: string;
  landmark: string | null;
  zone: DeliveryZone;
}

export interface SavedAddress extends DeliveryAddress {
  id: number;
  label: string | null;
  isDefault: boolean;
}

export interface ShipmentEventView {
  id: string;
  status: string;
  courierStatus: string | null;
  source: string;
  message: string | null;
  createdAt: string;
}

export interface Shipment {
  id: number;
  shopOrderId: number;
  provider: 'steadfast';
  mode: 'mock' | 'live' | null;
  consignmentId: string;
  trackingCode: string | null;
  trackingUrl: string | null;
  status:
    | 'booked'
    | 'in_transit'
    | 'on_hold'
    | 'delivered'
    | 'partial_delivered'
    | 'returned'
    | 'cancelled';
  courierStatus: string | null;
  courierStatusLabel: string | null;
  codAmount: number;
  deliveredAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  events: ShipmentEventView[];
}

export interface Payment {
  id: number;
  orderId: number;
  shopOrderId: number | null;
  method: 'bkash' | 'nagad' | 'card' | 'cash' | 'gift_card';
  purpose: 'full' | 'deposit' | 'balance';
  amount: number;
  status: 'initiated' | 'pending' | 'succeeded' | 'failed' | 'cancelled';
  gatewayTrxId: string | null;
  payerAccount: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Refund {
  id: number;
  paymentId: number;
  shopOrderId: number | null;
  amount: number;
  reason: string | null;
  status: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  customerId: number;
  contactName: string;
  contactPhone: string;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'paid' | 'partially_refunded' | 'refunded';
  subtotal: number;
  discountTotal: number;
  pickupFee: number;
  deliveryFee: number;
  grandTotal: number;
  amountDueOnline: number;
  amountPaid: number;
  customerNote: string | null;
  deliveryAddress: DeliveryAddress | null;
  placedAt: string | null;
  createdAt: string;
  shopOrders: ShopOrder[];
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  shopReply: string | null;
  createdAt: string;
  productId: number | null;
  productName: string | null;
  author: string;
}

export interface OrderDetail extends Order {
  payments: Payment[];
  refunds: Refund[];
  reviews: { id: number; productId: number | null; shopOrderId: number; rating: number }[];
  returns: { id: number; shopOrderId: number; status: string; reason: string; createdAt: string }[];
  coupon: { code: string } | null;
}

export type OfferStatus =
  'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'used';

export interface Offer {
  id: number;
  conversationId: number;
  shopId: number;
  variantId: number;
  productId: number;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  listPrice: number;
  offeredPrice: number;
  counterPrice: number | null;
  finalPrice: number | null;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;
  shop?: { id: number; slug: string; nameEn: string };
  imageUrl?: string | null;
  customer?: { id: number; fullName: string | null; noShowCount: number };
}

export interface Conversation {
  id: number;
  customerId: number;
  shopId: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  customerUnread: number;
  shopUnread: number;
  shop?: Shop;
  customer?: User;
}

export interface Message {
  id: string;
  conversationId: number;
  senderId: number;
  senderSide: 'customer' | 'shop' | 'system';
  body: string | null;
  productId: number | null;
  product?: { id: number; nameEn: string; images: ProductImage[] } | null;
  offerId: number | null;
  createdAt: string;
}

export interface Thread {
  conversation: {
    id: number;
    side: 'customer' | 'shop';
    shop: { id: number; slug: string; nameEn: string; logoUrl: string | null };
    customer: { id: number; fullName: string | null };
  };
  messages: Message[];
  offers: Offer[];
}

export interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  data: { href?: string };
  readAt: string | null;
  createdAt: string;
}

export interface SearchResult {
  q: string;
  markets: CursorPage<Market> | null;
  shops: CursorPage<Shop> | null;
  products: CursorPage<ProductCard> | null;
  resultsCount: number;
}

export interface DirectoryFloor {
  id: number;
  level: number;
  nameEn: string;
  nameBn: string | null;
  mapImageUrl: string | null;
  shops: Shop[];
}

export interface Directory {
  market: { id: number; slug: string; nameEn: string; nameBn: string };
  floors: DirectoryFloor[];
}

export interface PublicConfig {
  pickupFee: number;
  supportHotline: string;
  paymentWindowMinutes: number;
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  /** The farthest "Nearby" may reach, in km, set by the admin. */
  nearbyMaxKm: number;
}

export type MapKind = 'markets' | 'shops' | 'products';

/** One mall on the Nearby map, with the shops or products it holds. */
export interface NearbyMapPin {
  marketId: number;
  slug: string;
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  imageUrl: string | null;
  count: number;
  items: { id: number; slug: string | null; nameEn: string; nameBn: string; price?: number }[];
}

export interface NearbyMapResult {
  kind: MapKind;
  centre: { lat: number; lng: number; radiusKm: number };
  pins: NearbyMapPin[];
}

export interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  /** Taller artwork for phones; falls back to imageUrl. */
  mobileImageUrl?: string | null;
  /** The artwork already shows its headline: no text is drawn over it. */
  imageHasText?: boolean;
  linkUrl: string | null;
  placement: string;
  advertiser: string;
}
