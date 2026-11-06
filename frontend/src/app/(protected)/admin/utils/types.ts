import type {
  Category,
  Floor,
  Market,
  Order,
  PickupPoint,
  Shop,
  ShopOrder,
  User,
} from '@/utils/types';

export interface AdminDashboard {
  markets: number;
  shops: number;
  pendingShops: number;
  products: number;
  users: number;
  ordersToday: number;
  ordersMonth: number;
  gmvMonth: number;
  commissionMonth: number;
  pendingVerifications: number;
  series: { day: string; gmv: number; orders: number }[];
  zeroResultSearches: { query: string; searches: number }[];
  topCategories: { nameEn: string; gmv: number }[];
}

export interface MarketMemberRow {
  marketId: number;
  userId: number;
  role: 'admin' | 'manager' | 'desk_staff';
  user: User;
}

export interface AdminMarket extends Market {
  floors: Floor[];
  pickupPoints: PickupPoint[];
  members?: MarketMemberRow[];
}

export interface Verification {
  id: number;
  shopId: number;
  shop?: Shop & { market?: Market | null };
  kind: 'trade_license' | 'owner_nid' | 'tin' | 'bin_vat' | 'physical_visit';
  documentNumber: string | null;
  documentUrl: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresOn: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Plan {
  id: number;
  code: string;
  nameEn: string;
  nameBn: string;
  monthlyPrice: number;
  maxProducts: number | null;
  maxStaff: number | null;
  commissionDiscount: number;
}

export interface ShopMemberRow {
  shopId: number;
  userId: number;
  role: 'owner' | 'manager' | 'staff';
  isActive: boolean;
  user: User;
}

export interface AdminShop extends Shop {
  members: ShopMemberRow[];
  market: (Market & { floors?: Floor[] }) | null;
}

export interface AdminShopDetail extends AdminShop {
  categories: { shopId: number; categoryId: number; category: Category }[];
  verifications: Verification[];
  subscription: { id: number; status: string; startsAt: string; plan: Plan } | null;
  balance: number;
}

export interface CommissionRule {
  id: number;
  categoryId: number | null;
  category: Category | null;
  marketId: number | null;
  market: Market | null;
  shopId: number | null;
  shop: Shop | null;
  rate: number;
  validFrom: string;
  validTo: string | null;
  note: string | null;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  fundedBy: 'platform' | 'shop' | 'market';
  shopId: number | null;
  shop: Shop | null;
  marketId: number | null;
  market: Market | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscount: number | null;
  minOrderTotal: number;
  usageLimit: number | null;
  perUserLimit: number;
  usedCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface Balance {
  shopId: number;
  shopName: string;
  marketName: string | null;
  isVerified: boolean;
  balance: number;
  lastEntryAt: string | null;
  payoutAccount: string | null;
}

export interface Payout {
  id: number;
  shopId: number;
  shop: Shop;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminUser extends User {
  platformRole: string | null;
}

export interface AdminShopOrder extends Omit<ShopOrder, 'order'> {
  order: Order;
  shop: Shop & { market?: Market | null };
}

export interface AdminOrderDetail extends Order {
  customer: User;
  shopOrders: (ShopOrder & { shop: Shop })[];
}

export interface AuditEntry {
  id: string;
  actorId: number | null;
  actor: User | null;
  action: string;
  entityType: string;
  entityId: number | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminBanner {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  mobileImageUrl?: string | null;
  imageHasText?: boolean;
  linkUrl: string | null;
  placement: 'home_banner' | 'market_featured' | string;
  advertiser: string;
  shopId: number | null;
  marketId: number | null;
  price: number;
  startsAt: string;
  endsAt: string;
  status: 'draft' | 'scheduled' | 'running' | 'ended' | 'cancelled' | string;
  impressions: string;
  clicks: string;
  createdAt: string;
}

export interface AdminShipment {
  id: number;
  shopOrderId: number;
  subOrderNo: string;
  orderNo?: string;
  shopName?: string;
  provider: string;
  mode: 'mock' | 'live' | null;
  consignmentId: string;
  trackingCode: string | null;
  trackingUrl: string | null;
  status: string;
  courierStatus: string | null;
  courierStatusLabel: string | null;
  codAmount: number;
  courierCharge: number | null;
  recipient: { name: string; phone: string; address: string; zone: string | null } | null;
  deliveredAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

// ------------------------------------------------------------ locations (division → district → area → sub-area)

export type GeoLevel = 'divisions' | 'districts' | 'areas' | 'sub-areas';

/** One row of /admin/geo/:level (same shape at every level). */
export interface GeoRow {
  id: number;
  nameEn: string;
  nameBn: string;
  isActive: boolean;
  parentId: number | null;
  parentName: string | null;
  /** "Division › District › Area" of the parent chain. */
  parentPath: string;
  divisionId?: number;
  districtId?: number;
  areaId?: number;
  /** areas only */
  kind?: string;
  isServiceable?: boolean;
  /** Districts in a division, areas in a district, sub-areas in an area. */
  childCount: number;
  marketCount: number;
}

/** A row of the public pickers (/geo/*). */
export interface GeoOption {
  id: number;
  nameEn: string;
  nameBn: string;
  divisionId?: number;
  districtId?: number;
  areaId?: number;
}

/** A product brand (GET /admin/brands). `productCount` counts active products. */
export interface AdminBrand {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  productCount: number;
}
